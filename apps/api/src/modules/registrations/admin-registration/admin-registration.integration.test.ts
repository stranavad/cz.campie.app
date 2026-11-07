import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const BUS = '0190a2b4-0000-7000-8000-0000000000f1';

const bus = {
  id: BUS,
  type: 'single_choice',
  label: 'Doprava',
  hint: null,
  required: false,
  scope: 'participant',
  options: [
    { id: 'bus', label: 'Autobus', surcharge: 300, needsVerification: false },
    { id: 'train', label: 'Vlak', surcharge: 200, needsVerification: false },
  ],
};

const TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Pokusov',
  capacity: 1,
  minAge: 10,
  maxAge: 12,
  opensAt: '2027-05-01T08:00',
  closesAt: null,
  closedManually: false,
  websiteUrl: null,
  basePrice: 6500,
  earlyBirdPrice: null,
  earlyBirdLastDay: null,
  deposit: null,
  depositDueDays: 14,
  balanceDueDate: null,
};

const CHILD = { firstName: 'Ema', lastName: 'Testovací', birthDate: '2021-05-01' };

describe('admin registrations', () => {
  const { app, http, clock, database, jobs, mail, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let turnusId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const create = (body: object = {}, headers = owner) =>
    http()
      .post(`/api/camps/${campId}/registrations`)
      .set(headers)
      .send({
        idempotencyKey: randomUUID(),
        turnusId,
        submission: {
          registration: {
            guardianFirstName: 'Jana',
            guardianLastName: 'Testovací',
            guardianEmail: 'jana.testovaci@example.com',
            guardianPhone: '+420 123 456 789',
          },
          participants: [{ ...CHILD, [BUS]: 'bus' }],
        },
        paymentChoice: 'full',
        discountCode: null,
        declarations: [],
        ...body,
      });
  const lines = (registrationId: string) =>
    query('SELECT kind, label, amount FROM price_lines WHERE registration_id = $1 ORDER BY position', [registrationId]);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ siblingDiscountAmount: 400, siblingDiscountAppliesTo: 'every_child' });
    turnusId = (await http().post(`/api/camps/${campId}/turnusy`).set(owner).send(TURNUS)).body.id;
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({
        definition: { standard: [], custom: [bus] },
        maxParticipants: 3,
        declarations: [
          { id: '0190a2b4-0000-7000-8000-0000000000fd', text: 'Řád', mandatory: true, url: null, fileId: null },
        ],
      });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
  });

  it('creates a Registration before the window, over capacity and outside age limits, like a public one', async () => {
    expect((await create()).status).toBe(201);
    const second = await create();

    expect(second.status).toBe(201);
    expect(second.body.variableSymbol).toMatch(/^27\d{6}$/);
    await jobs().drain();
    expect(await query('SELECT count(*)::int AS pdfs FROM participants WHERE prihlaska_file_id IS NOT NULL')).toEqual([
      { pdfs: 2 },
    ]);
    expect(await query(`SELECT actor_kind FROM audit_entries WHERE action = 'registration.create'`)).toEqual([
      { actor_kind: 'admin' },
      { actor_kind: 'admin' },
    ]);
  });

  it('applies a code past its limit or expiry, counted as a use, but not an unknown one', async () => {
    await http()
      .post(`/api/camps/${campId}/discount-codes`)
      .set(owner)
      .send({ code: 'STARY', kind: 'fixed', value: 1000, usageLimit: 1, expiresOn: '2027-01-01' });

    const applied = await create({ discountCode: 'stary' });
    expect(applied.body.total).toBe(5800);
    expect((await create({ discountCode: 'STARY' })).body.total).toBe(5800);
    expect(await query('SELECT count(*)::int AS uses FROM discount_code_uses')).toEqual([{ uses: 2 }]);

    expect((await create({ discountCode: 'NIKDY' })).body).toMatchObject({
      fields: [{ path: ['discountCode'], code: 'discount_code_unknown' }],
    });
  });

  it('previews the price lines a changed Paid extra adds, and saving adds exactly them, audited', async () => {
    const { id } = (await create()).body;
    const participantId = (
      await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [id])
    )[0]?.id;
    const change = {
      registration: {},
      participants: [{ participantId, answers: { [BUS]: 'train', lastName: 'Nová' } }],
    };

    const preview = await http().post(`/api/registrations/${id}/answers/preview`).set(owner).send(change);
    expect(preview.body.lines).toEqual([
      { kind: 'paid_extra', participant: 0, label: 'Doprava: Autobus', amount: -300 },
      { kind: 'paid_extra', participant: 0, label: 'Doprava: Vlak', amount: 200 },
    ]);

    const saved = await http()
      .put(`/api/registrations/${id}/answers`)
      .set(owner)
      .send({ ...change, expectedLines: preview.body.lines });
    expect(saved.body.participants[0]).toMatchObject({ lastName: 'Nová' });
    expect((await lines(id)).slice(2)).toEqual(
      preview.body.lines.map(({ kind, label, amount }: { kind: string; label: string; amount: number }) => ({
        kind,
        label,
        amount,
      })),
    );
    expect(saved.body.ledger.total).toBe(6700);
    expect(
      await query(
        `SELECT actor_kind, changes->'participants'->'new'->0->>'lastName' AS last_name FROM audit_entries WHERE action = 'registration.edit'`,
      ),
    ).toEqual([{ actor_kind: 'admin', last_name: 'Nová' }]);
  });

  it('refuses answers the form does not take', async () => {
    const { id } = (await create()).body;
    const participantId = (
      await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [id])
    )[0]?.id;

    const refused = await http()
      .put(`/api/registrations/${id}/answers`)
      .set(owner)
      .send({
        registration: { neznamy: 'x' },
        participants: [{ participantId, answers: { [BUS]: 'lod', firstName: '' } }],
        expectedLines: [],
      });

    expect(refused.status).toBe(400);
    expect(refused.body.fields).toEqual([
      { path: ['registration', 'neznamy'], code: 'form_answer_unknown' },
      { path: ['participants', 0, BUS], code: 'form_answer_invalid' },
      { path: ['participants', 0, 'firstName'], code: 'form_answer_required' },
    ]);
  });

  it('adds a child at the price in force with its Sibling discount, as previewed', async () => {
    const { id } = (await create()).body;
    const child = { answers: { firstName: 'Jan', lastName: 'Testovací', birthDate: '2019-02-02', [BUS]: 'train' } };

    const preview = await http().post(`/api/registrations/${id}/participants/preview`).set(owner).send(child);
    expect(preview.body.lines).toEqual([
      { kind: 'base_price', participant: 1, label: null, amount: 6500 },
      { kind: 'paid_extra', participant: 1, label: 'Doprava: Vlak', amount: 200 },
      { kind: 'sibling_discount', participant: 1, label: null, amount: -400 },
      { kind: 'sibling_discount', participant: 0, label: null, amount: -400 },
    ]);

    const saved = await http()
      .post(`/api/registrations/${id}/participants`)
      .set(owner)
      .send({ ...child, expectedLines: preview.body.lines });
    expect(saved.body.participants.map(({ firstName }: { firstName: string }) => firstName)).toEqual(['Ema', 'Jan']);
    expect(saved.body.ledger.total).toBe(6800 + 6700 - 800);
  });

  it('moves a Registration within its Camp only, keeping its price lines', async () => {
    const { id } = (await create()).body;
    const before = await lines(id);
    const sameCamp = (
      await http()
        .post(`/api/camps/${campId}/turnusy`)
        .set(owner)
        .send({ ...TURNUS, name: 'Turnus 2' })
    ).body.id;
    const otherCamp = await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const foreign = (await http().post(`/api/camps/${otherCamp}/turnusy`).set(owner).send(TURNUS)).body.id;

    const moved = await http().post(`/api/registrations/${id}/move`).set(owner).send({ turnusId: sameCamp });
    expect(moved.body.turnus).toMatchObject({ id: sameCamp, name: 'Turnus 2' });
    expect(await lines(id)).toEqual(before);

    const refused = await http().post(`/api/registrations/${id}/move`).set(owner).send({ turnusId: foreign });
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'turnus_other_camp' });
  });

  it('changes a guardian, the email at once', async () => {
    const { id } = (await create()).body;

    const changed = await http()
      .put(`/api/registrations/${id}/guardians/1`)
      .set(owner)
      .send({ firstName: 'Jana', lastName: 'Jiná', email: 'jana.jina@example.com', phone: '' });

    expect(changed.body.guardians).toEqual([
      {
        position: 1,
        firstName: 'Jana',
        lastName: 'Jiná',
        email: 'jana.jina@example.com',
        phone: null,
        undeliverable: false,
      },
    ]);
  });

  it('reverses a changed answer as it was charged, even after the price list changed', async () => {
    const { id } = (await create()).body;
    const participantId = (
      await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [id])
    )[0]?.id;
    const edit = async (option: string) => {
      const change = { registration: {}, participants: [{ participantId, answers: { [BUS]: option } }] };
      const preview = await http().post(`/api/registrations/${id}/answers/preview`).set(owner).send(change);

      await http()
        .put(`/api/registrations/${id}/answers`)
        .set(owner)
        .send({ ...change, expectedLines: preview.body.lines });
    };

    await edit('train');
    // The camp raises the train's price; the train already charged is taken back at what it cost.
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({
        definition: {
          standard: [],
          custom: [{ ...bus, options: [bus.options[0], { ...bus.options[1], surcharge: 250 }] }],
        },
        maxParticipants: 3,
        declarations: [],
      });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
    await edit('bus');

    expect((await lines(id)).slice(1)).toEqual([
      { kind: 'paid_extra', label: 'Doprava: Autobus', amount: 300 },
      { kind: 'paid_extra', label: 'Doprava: Autobus', amount: -300 },
      { kind: 'paid_extra', label: 'Doprava: Vlak', amount: 200 },
      { kind: 'paid_extra', label: 'Doprava: Vlak', amount: -200 },
      { kind: 'paid_extra', label: 'Doprava: Autobus', amount: 300 },
    ]);
  });

  it('refuses a save whose price lines differ from what its preview showed', async () => {
    const { id } = (await create()).body;
    const participantId = (
      await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [id])
    )[0]?.id;

    const refused = await http()
      .put(`/api/registrations/${id}/answers`)
      .set(owner)
      .send({ registration: {}, participants: [{ participantId, answers: { [BUS]: 'train' } }], expectedLines: [] });

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'price_changed' });
  });

  it('gives a Sibling discount only to children that have none yet', async () => {
    const { id } = (await create()).body;
    const add = async (firstName: string) => {
      const child = { answers: { firstName, lastName: 'Testovací', birthDate: '2019-02-02' } };
      const preview = await http().post(`/api/registrations/${id}/participants/preview`).set(owner).send(child);

      await http()
        .post(`/api/registrations/${id}/participants`)
        .set(owner)
        .send({ ...child, expectedLines: preview.body.lines });

      return preview.body.lines;
    };

    await add('Jan');
    await query("UPDATE participants SET status = 'cancelled' WHERE registration_id = $1 AND first_name = 'Ema'", [id]);

    expect(await add('Ida')).toEqual([
      { kind: 'base_price', participant: 2, label: null, amount: 6500 },
      { kind: 'sibling_discount', participant: 2, label: null, amount: -400 },
    ]);
  });

  it('changes a guardian email at once, tells the old address and audits each change', async () => {
    const { id } = (await create()).body;
    const sameCamp = (
      await http()
        .post(`/api/camps/${campId}/turnusy`)
        .set(owner)
        .send({ ...TURNUS, name: 'Turnus 2' })
    ).body.id;

    await http()
      .put(`/api/registrations/${id}/guardians/1`)
      .set(owner)
      .send({ firstName: 'Jana', lastName: 'Testovací', email: 'jana.jina@example.com', phone: '' });
    await http().post(`/api/registrations/${id}/move`).set(owner).send({ turnusId: sameCamp });
    await jobs().drain();

    expect(
      mail()
        .sent.filter(({ to }) => to.includes('jana.testovaci@example.com'))
        .map(({ subject }) => subject),
    ).toContain('Změna e-mailové adresy u přihlášky');
    expect(
      await query(`SELECT action FROM audit_entries WHERE target_id = $1 AND actor_kind = 'admin' ORDER BY id`, [id]),
    ).toEqual([
      { action: 'registration.create' },
      { action: 'registration_guardian.update' },
      { action: 'registration.move' },
    ]);
  });

  it("refuses another Organisation's Turnus and an inactive code", async () => {
    const otherId = await createOrganisation(app());
    const otherCamp = await createCamp(app(), otherId, 'Cizí tábor', 'cizi-tabor');
    const foreign = await submitRegistration(app(), otherId, otherCamp);
    const foreignTurnus = (
      await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [foreign.id])
    )[0]?.turnus_id;
    const { id: codeId } = (
      await http()
        .post(`/api/camps/${campId}/discount-codes`)
        .set(owner)
        .send({ code: 'VYPNUTY', kind: 'fixed', value: 1000, usageLimit: null, expiresOn: null })
    ).body;
    await http().patch(`/api/discount-codes/${codeId}`).set(owner).send({ active: false });

    expect((await create({ turnusId: foreignTurnus })).status).toBe(404);
    expect((await create({ discountCode: 'VYPNUTY' })).body).toMatchObject({
      fields: [{ path: ['discountCode'], code: 'discount_code_inactive' }],
    });
  });

  it('takes Registrations write for every change', async () => {
    const { id } = await submitRegistration(app(), organisationId, campId);

    await expectPermission(['registrations', 'write'], organisationId, (headers) => create({}, headers));
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${id}/move`).set(headers).send({ turnusId }),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${id}/answers/preview`).set(headers).send({ registration: {}, participants: [] }),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http()
        .put(`/api/registrations/${id}/answers`)
        .set(headers)
        .send({ registration: {}, participants: [], expectedLines: [] }),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${id}/participants/preview`).set(headers).send({ answers: {} }),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${id}/participants`).set(headers).send({ answers: {}, expectedLines: [] }),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http()
        .put(`/api/registrations/${id}/guardians/1`)
        .set(headers)
        .send({ firstName: 'Jana', lastName: 'Testovací', email: 'jana.testovaci@example.com', phone: '' }),
    );
  });
});
