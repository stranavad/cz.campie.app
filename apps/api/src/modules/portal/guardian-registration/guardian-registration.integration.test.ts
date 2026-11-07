import { beforeEach, describe, expect, it } from 'vitest';

import {
  brandOrganisation,
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const JANA = 'jana.testovaci@example.com';
const WITH_DEPOSIT = { basePrice: 6500, deposit: 2000, depositDueDays: 14, balanceDueDate: '2027-06-15' };

describe('guardian portal Registrations', () => {
  const { app, http, clock, database, jobs } = useTestApp();

  let organisationId: string;
  let registrationId: string;
  let owner: RequestHeaders;
  let asJana: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const portal = (headers = asJana) => http().get('/api/portal/registrations').set(headers);

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    await brandOrganisation(app(), organisationId, { bankAccount: '19-2000145399/0800' });
    const campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    registrationId = (
      await submitRegistration(app(), organisationId, campId, { turnus: WITH_DEPOSIT, paymentChoice: 'deposit' })
    ).id;
    await jobs().drain();
    asJana = (await createGuardianSession(app(), organisationId, JANA)).headers;
  });

  it('shows the price, payments and balance as the ledger derives them', async () => {
    await http()
      .post(`/api/registrations/${registrationId}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 1500, paidOn: '2027-04-12', note: 'Interní poznámka' });
    await http()
      .post(`/api/registrations/${registrationId}/price-adjustments`)
      .set(owner)
      .send({ amount: 300, note: 'Tričko' });
    const ledger = (await http().get(`/api/registrations/${registrationId}/ledger`).set(owner)).body;

    const [shown] = (await portal()).body.registrations;

    expect(shown).toMatchObject({
      priceLines: [{ kind: 'base_price', participant: 0, amount: 6500 }],
      adjustments: [{ amount: 300 }],
      payments: [{ amount: 1500, paidOn: '2027-04-12' }],
      total: ledger.total,
      paid: ledger.paid,
      balance: ledger.balance,
      status: ledger.status,
      overdue: ledger.overdue,
      payment: { phase: ledger.amountDue.phase, amount: ledger.amountDue.amount, dueDate: ledger.amountDue.dueDate },
    });
    expect(JSON.stringify(shown)).not.toContain('Interní poznámka');
    expect(JSON.stringify(shown)).not.toContain('Tričko');
  });

  it('gives a QR platba for the amount due now and for everything at once', async () => {
    const { payment } = (await portal()).body.registrations[0];

    expect(payment).toMatchObject({
      account: '19-2000145399/0800',
      amount: 2000,
      qrPlatba: expect.stringMatching(/\*AM:2000\.00\*.*\*DT:20270424\*/),
      balance: { amount: 4500, outstanding: 6500, qrPlatba: expect.stringContaining('*AM:6500.00*') },
    });
  });

  it('shows the camp contact and a contact for technical problems', async () => {
    expect((await portal()).body).toMatchObject({
      technicalContact: 'operator@example.com',
      registrations: [{ camp: { name: 'Letní tábor', contactEmail: expect.stringMatching(/^kontakt-/) } }],
    });
  });

  it("opens a Participant's Přihláška through a short-lived link only", async () => {
    const [participant] = (await portal()).body.registrations[0].participants;
    const download = () => http().get(participant.prihlaska.url);

    expect((await download()).status).toBe(200);

    clock().advance(6 * 60 * 1000);
    expect((await download()).status).toBe(404);
  });

  it('shows only what a guardian may see: no answers, notes or health data', async () => {
    const [shown] = (await portal()).body.registrations;

    expect(Object.keys(shown).sort()).toEqual(
      [
        'adjustments',
        'balance',
        'camp',
        'id',
        'overdue',
        'paid',
        'participants',
        'payment',
        'payments',
        'priceLines',
        'status',
        'submittedAt',
        'total',
        'turnus',
        'variableSymbol',
      ].sort(),
    );
    expect(Object.keys(shown.participants[0]).sort()).toEqual(
      ['firstName', 'id', 'lastName', 'position', 'prihlaska', 'status'].sort(),
    );
  });

  it('shows a Cancelled Participant as cancelled', async () => {
    await query("UPDATE participants SET status = 'cancelled' WHERE registration_id = $1", [registrationId]);

    expect((await portal()).body.registrations[0].participants).toMatchObject([{ status: 'cancelled' }]);
  });
});
