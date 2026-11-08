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

const RETURNING = '0190a2b4-0000-7000-8000-0000000000e1';
const DIET = '0190a2b4-0000-7000-8000-0000000000e2';
const SHIRT = '0190a2b4-0000-7000-8000-0000000000e3';

const returning = (label: string) => ({
  id: RETURNING,
  type: 'yes_no',
  label,
  hint: null,
  required: false,
  scope: 'participant',
  health: false,
  surcharge: -500,
  needsVerification: true,
});
const diet = {
  id: DIET,
  type: 'single_choice',
  label: 'Strava',
  hint: null,
  required: false,
  scope: 'participant',
  health: false,
  options: [{ id: 'veg', label: 'Vegetariánská', surcharge: null, needsVerification: false }],
};
const shirt = {
  id: SHIRT,
  type: 'short_text',
  label: 'Tričko',
  hint: null,
  required: false,
  scope: 'participant',
  health: false,
};

describe('registration detail', () => {
  const { app, http, clock, database, jobs, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let registrationId: string;
  let participantId: string;
  let owner: RequestHeaders;
  let ownerEmail: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const publish = async (custom: object[]) => {
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({
        definition: { standard: [], custom },
        maxParticipants: 3,
        declarations: [
          { id: '0190a2b4-0000-7000-8000-0000000000ef', text: 'Řád', mandatory: true, url: null, fileId: null },
        ],
      });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
  };
  const detail = (headers = owner) => http().get(`/api/registrations/${registrationId}`).set(headers);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    const admin = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    owner = admin.headers(organisationId);
    ownerEmail = admin.email;
    await publish([returning('Byl už u nás'), diet]);
    registrationId = (
      await submitRegistration(app(), organisationId, campId, {
        children: [
          { firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01', [RETURNING]: true, [DIET]: 'veg' },
        ],
      })
    ).id;
    participantId =
      (await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [registrationId]))[0]
        ?.id ?? '';
    await jobs().drain();
  });

  it('labels answers as the submitted version asked them, marking later and removed fields', async () => {
    await publish([returning('Už jezdil'), shirt]);

    const { body } = await detail();

    expect(body).toMatchObject({
      formVersion: 1,
      camp: { name: 'Letní tábor' },
      guardians: [{ position: 1, email: 'jana.testovaci@example.com' }],
      participants: [
        {
          firstName: 'Ema',
          ageOnStart: 11,
          status: 'registered',
          prihlaska: { url: expect.stringMatching(/^\/api\/downloads\//) },
          answers: [
            { key: RETURNING, label: 'Byl už u nás', value: true, state: 'answered' },
            { key: DIET, label: 'Strava', value: 'Vegetariánská', state: 'removed' },
            { key: SHIRT, label: 'Tričko', value: null, state: 'added' },
          ],
        },
      ],
      priceLines: [
        { kind: 'base_price', participant: 0, amount: 6500 },
        { kind: 'claimed_discount', participant: 0, label: 'Byl už u nás', amount: -500 },
      ],
      ledger: { total: 6000, status: 'unpaid' },
      declarations: [{ text: 'Řád', mandatory: true, accepted: true, answeredAt: '2027-04-10T10:00:00.000Z' }],
      claimedDiscounts: [{ participantId, fieldId: RETURNING, optionId: null, amount: -500, verifiedAt: null }],
    });
  });

  it('confirms a Claimed discount once, audited, and takes it out of the unverified filter', async () => {
    const turnusId = (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations'))[0]?.turnus_id;
    const unverified = async () =>
      (
        await http()
          .get(`/api/turnusy/${turnusId}/participants`)
          .query({ unverifiedClaimedDiscount: 'true' })
          .set(owner)
      ).body;
    const verify = (headers = owner) =>
      http()
        .post(`/api/registrations/${registrationId}/claimed-discounts/verify`)
        .set(headers)
        .send({ participantId, fieldId: RETURNING, optionId: null });
    expect(await unverified()).toHaveLength(1);

    const confirmed = await verify();
    await verify();

    expect(confirmed.body.claimedDiscounts[0].verifiedAt).toBe('2027-04-10T10:00:00.000Z');
    expect(await unverified()).toEqual([]);
    expect(await query(`SELECT action FROM audit_entries WHERE action = 'claimed_discount.verify'`)).toHaveLength(1);
    expect(
      (
        await http()
          .post(`/api/registrations/${registrationId}/claimed-discounts/verify`)
          .set(owner)
          .send({ participantId, fieldId: DIET, optionId: 'veg' })
      ).status,
    ).toBe(404);
  });

  it('lists the history of the Registration and its Participants, newest first, admins by email', async () => {
    await http()
      .post(`/api/registrations/${registrationId}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 1000, paidOn: '2027-04-10', note: 'Hotově' });

    const { body } = await http().get(`/api/registrations/${registrationId}/history`).set(owner);

    expect(body.map(({ action }: { action: string }) => action)).toEqual([
      'payment.create',
      'participant.generate_prihlaska',
      'registration.submit',
    ]);
    expect(body[0]).toMatchObject({
      actor: { kind: 'admin', name: ownerEmail },
      changes: { amount: { old: null, new: 1000 } },
      encryptedFields: [],
    });
    expect(body[2]).toMatchObject({ actor: { kind: 'guardian', name: 'jana.testovaci@example.com' } });
    // The guardian's address stays in the audit log, never in what the history shows.
    expect(JSON.stringify(body)).not.toContain('203.0.113.7');
  });

  it('takes Registrations read to see and write to confirm', async () => {
    await expectPermission(['registrations', 'read'], organisationId, (headers) => detail(headers));
    await expectPermission(['registrations', 'read'], organisationId, (headers) =>
      http().get(`/api/registrations/${registrationId}/history`).set(headers),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http()
        .post(`/api/registrations/${registrationId}/claimed-discounts/verify`)
        .set(headers)
        .send({ participantId, fieldId: RETURNING, optionId: null }),
    );
  });

  it("answers another Organisation's admins and guessed ids with 404", async () => {
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectIsolated(() => detail(asOther));
    await expectIsolated(() => http().get(`/api/registrations/${registrationId}/history`).set(asOther));
    await expectIsolated(() =>
      http()
        .post(`/api/registrations/${registrationId}/claimed-discounts/verify`)
        .set(asOther)
        .send({ participantId, fieldId: RETURNING, optionId: null }),
    );
    expect((await http().get('/api/registrations/0190a2b4-0000-7000-8000-00000000ffff').set(owner)).status).toBe(404);
  });
});
