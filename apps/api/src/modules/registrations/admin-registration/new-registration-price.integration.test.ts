import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAdmin, createCamp, createOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
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
  health: false,
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
  capacity: 10,
  minAge: 8,
  maxAge: 12,
  opensAt: '2027-03-01T08:00',
  closesAt: null,
  closedManually: false,
  websiteUrl: null,
  basePrice: 6500,
  earlyBirdPrice: 6000,
  earlyBirdLastDay: '2027-04-30',
  deposit: 2000,
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

const GUARDIAN = {
  guardianFirstName: 'Jana',
  guardianLastName: 'Testovací',
  guardianEmail: 'jana.testovaci@example.com',
  guardianPhone: '+420 123 456 789',
};

const EMA = { firstName: 'Ema', lastName: 'Testovací', birthDate: '2017-05-01' };
const JAN = { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-02-02' };

describe('new admin registration price', () => {
  const { app, http, clock, database, jobs, mail, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let turnusId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const bodyOf = (overrides: object = {}) => ({
    idempotencyKey: randomUUID(),
    turnusId,
    submission: {
      registration: GUARDIAN,
      participants: [
        { ...EMA, [BUS]: 'bus' },
        { ...JAN, [BUS]: 'train' },
      ],
    },
    paymentChoice: 'deposit',
    discountCode: null,
    declarations: [],
    ...overrides,
  });
  const preview = (body: object, headers = owner) =>
    http().post(`/api/camps/${campId}/registrations/preview`).set(headers).send(body);
  const create = (body: object, headers = owner) =>
    http().post(`/api/camps/${campId}/registrations`).set(headers).send(body);
  const addCode = (body: object) =>
    http()
      .post(`/api/camps/${campId}/discount-codes`)
      .set(owner)
      .send({ kind: 'percentage', value: 10, usageLimit: null, expiresOn: null, ...body });

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
      .send({ definition: { standard: [], custom: [bus] }, maxParticipants: 3, declarations: [] });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
  });

  it('previews the lines, total, Deposit and due dates, and creating with the same body stores exactly them', async () => {
    await addCode({ code: 'LETO10' });
    const body = bodyOf({ discountCode: 'leto10' });

    const previewed = await preview(body);

    expect(previewed.status).toBe(200);
    expect(previewed.body).toEqual({
      lines: [
        { kind: 'early_bird_price', participant: 0, label: null, amount: 6000 },
        { kind: 'early_bird_price', participant: 1, label: null, amount: 6000 },
        { kind: 'paid_extra', participant: 0, label: 'Doprava: Autobus', amount: 300 },
        { kind: 'paid_extra', participant: 1, label: 'Doprava: Vlak', amount: 200 },
        { kind: 'discount_code', participant: null, label: 'LETO10', amount: -1200 },
        { kind: 'sibling_discount', participant: 0, label: null, amount: -400 },
        { kind: 'sibling_discount', participant: 1, label: null, amount: -400 },
      ],
      total: 10500,
      depositAvailable: true,
      depositTotal: 4000,
      depositDueDate: '2027-04-24',
      balanceDueDate: '2027-06-15',
      discountCode: 'applied',
    });

    const created = await create(body);
    expect(created.body).toMatchObject({ total: 10500, depositTotal: 4000 });
    const detail = await http().get(`/api/registrations/${created.body.id}`).set(owner);
    expect(detail.body.priceLines).toEqual(previewed.body.lines);
    expect(
      await query(
        `SELECT to_char(deposit_due_date, 'YYYY-MM-DD') AS "depositDueDate",
                to_char(balance_due_date, 'YYYY-MM-DD') AS "balanceDueDate"
           FROM registrations WHERE id = $1`,
        [created.body.id],
      ),
    ).toEqual([{ depositDueDate: '2027-04-24', balanceDueDate: '2027-06-15' }]);
  });

  it('shows a code past its limit or expiry as applied, and an unknown or inactive one as not applied', async () => {
    await addCode({ code: 'STARY', kind: 'fixed', value: 1000, usageLimit: 1, expiresOn: '2027-01-01' });
    const { id: inactive } = (await addCode({ code: 'VYPNUTY' })).body;
    await http().patch(`/api/discount-codes/${inactive}`).set(owner).send({ active: false });
    const codeOf = async (discountCode: string) => {
      const { body } = await preview(bodyOf({ discountCode }));

      return {
        check: body.discountCode,
        line: body.lines.find(({ kind }: { kind: string }) => kind === 'discount_code'),
      };
    };

    expect(await codeOf('stary')).toEqual({
      check: 'applied',
      line: { kind: 'discount_code', participant: null, label: 'STARY', amount: -1000 },
    });
    expect(await codeOf('VYPNUTY')).toEqual({ check: 'not_applied', line: undefined });
    expect(await codeOf('NIKDY')).toEqual({ check: 'not_applied', line: undefined });
  });

  it('prices a closed and full Turnus and a child outside the age limits', async () => {
    const closed = (
      await http()
        .post(`/api/camps/${campId}/turnusy`)
        .set(owner)
        .send({ ...TURNUS, name: 'Turnus 2', capacity: 1, closedManually: true, deposit: null })
    ).body.id;
    await create(bodyOf({ turnusId: closed, paymentChoice: 'full' }));

    const previewed = await preview(
      bodyOf({
        turnusId: closed,
        paymentChoice: 'full',
        submission: { registration: GUARDIAN, participants: [{ ...EMA, birthDate: '2024-01-01' }] },
      }),
    );

    expect(previewed.status).toBe(200);
    expect(previewed.body).toMatchObject({
      lines: [{ kind: 'early_bird_price', participant: 0, label: null, amount: 6000 }],
      total: 6000,
      depositAvailable: false,
      depositTotal: null,
    });
  });

  it('saves nothing: no Registration, Variable symbol, code use, audit entry or job', async () => {
    await addCode({ code: 'LETO10' });
    const counts = () =>
      query(
        `SELECT (SELECT count(*)::int FROM registrations) AS registrations,
                (SELECT count(*)::int FROM discount_code_uses) AS uses,
                (SELECT count(*)::int FROM audit_entries) AS audit`,
      );
    const before = await counts();

    expect((await preview(bodyOf({ discountCode: 'LETO10', cashDeposit: true }))).status).toBe(200);

    expect(await counts()).toEqual(before);
    expect(await jobs().drain()).toEqual([]);
  });

  it('takes Registrations write', async () => {
    await expectPermission(['registrations', 'write'], organisationId, (headers) => preview(bodyOf(), headers));
  });

  it('refuses a Turnus of another Camp, and does not find a Camp of another Organisation', async () => {
    const otherCamp = await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const foreignTurnus = (await http().post(`/api/camps/${otherCamp}/turnusy`).set(owner).send(TURNUS)).body.id;
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    expect((await preview(bodyOf({ turnusId: foreignTurnus }))).status).toBe(404);
    await expectIsolated(async () => {
      const response = await preview(bodyOf(), asOther);
      expect(response.status).toBe(404);

      return response;
    });
  });

  it('records a cash Deposit once, dated today in Prague, audited and emailed once, even when replayed', async () => {
    // Already the 11th in Prague; a new session, as the morning's has run out.
    clock().set(new Date('2027-04-10T22:30:00Z'));
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const body = bodyOf({ cashDeposit: true });

    const created = await create(body);
    const replayed = await create(body);

    expect(created.status).toBe(201);
    expect(replayed.body).toEqual(created.body);
    const ledger = (await http().get(`/api/registrations/${created.body.id}/ledger`).set(owner)).body;
    expect(ledger.payments).toEqual([
      expect.objectContaining({ source: 'manual', amount: 4000, paidOn: '2027-04-11', note: 'Záloha v hotovosti' }),
    ]);
    expect(ledger.amountDue).toMatchObject({ phase: 'balance', amount: 11700 - 4000 });
    expect(
      await query(`SELECT actor_kind, action FROM audit_entries WHERE target_id = $1 ORDER BY id`, [created.body.id]),
    ).toEqual([
      { actor_kind: 'admin', action: 'registration.create' },
      { actor_kind: 'admin', action: 'payment.create' },
    ]);
    await jobs().drain();
    expect(mail().sent.filter(({ subject }) => subject.startsWith('Přijali jsme platbu'))).toHaveLength(1);
  });

  it('refuses a cash Deposit without the Deposit chosen or a Turnus that has one, saving nothing', async () => {
    const without = (
      await http()
        .post(`/api/camps/${campId}/turnusy`)
        .set(owner)
        .send({ ...TURNUS, name: 'Turnus 2', deposit: null })
    ).body.id;

    const paidInFull = await create(bodyOf({ paymentChoice: 'full', cashDeposit: true }));
    const noDeposit = await create(bodyOf({ turnusId: without, cashDeposit: true }));

    expect([paidInFull.status, noDeposit.status]).toEqual([409, 409]);
    expect(paidInFull.body).toMatchObject({ code: 'cash_deposit_unavailable' });
    expect(noDeposit.body).toMatchObject({ code: 'cash_deposit_unavailable' });
    expect(await query('SELECT count(*)::int AS registrations FROM registrations')).toEqual([{ registrations: 0 }]);
  });

  it('keeps nothing of a Registration whose cash Deposit failed to record, and a retry records it once', async () => {
    await addCode({ code: 'LETO10' });
    const body = bodyOf({ discountCode: 'LETO10', cashDeposit: true });
    await query(`CREATE FUNCTION refuse_payment() RETURNS trigger LANGUAGE plpgsql AS $$
                   BEGIN RAISE EXCEPTION 'payments are down'; END $$`);
    await query(
      'CREATE TRIGGER refuse_payment BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION refuse_payment()',
    );
    const counts = () =>
      query(
        `SELECT (SELECT count(*)::int FROM registrations) AS registrations,
                (SELECT count(*)::int FROM participants) AS participants,
                (SELECT count(*)::int FROM price_lines) AS lines,
                (SELECT count(*)::int FROM discount_code_uses) AS uses,
                (SELECT count(*)::int FROM payments) AS payments,
                (SELECT count(*)::int FROM audit_entries WHERE target_type = 'registration') AS audit`,
      );

    expect((await create(body)).status).toBe(500);
    expect(await counts()).toEqual([{ registrations: 0, participants: 0, lines: 0, uses: 0, payments: 0, audit: 0 }]);
    expect(await jobs().drain()).toEqual([]);

    await query('DROP TRIGGER refuse_payment ON payments');
    expect((await create(body)).status).toBe(201);
    expect(await counts()).toEqual([{ registrations: 1, participants: 2, lines: 7, uses: 1, payments: 1, audit: 2 }]);
  });
});
