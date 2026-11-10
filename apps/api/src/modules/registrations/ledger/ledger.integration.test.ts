import { beforeEach, describe, expect, it } from 'vitest';

import {
  brandOrganisation,
  createAdmin,
  createCamp,
  createOrganisation,
  FAKE_INVOICE_REQUEST,
  offerInvoiceRequests,
  OPEN_TURNUS,
  signIn,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

// A Turnus with a Deposit, so a Registration owes it first.
const WITH_DEPOSIT = { basePrice: 6500, deposit: 2000, depositDueDays: 14, balanceDueDate: '2027-06-15' };

describe('payment ledger', () => {
  const { app, http, clock, database, jobs, mail, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let registrationId: string;
  let owner: RequestHeaders;
  let adminId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const ledger = (headers = owner, id = registrationId) => http().get(`/api/registrations/${id}/ledger`).set(headers);
  const pay = (body: object, headers = owner, id = registrationId) =>
    http()
      .post(`/api/registrations/${id}/payments`)
      .set(headers)
      .send({ kind: 'payment', paidOn: '2027-04-12', note: 'Převodem', ...body });
  const adjust = (body: object, headers = owner) =>
    http().post(`/api/registrations/${registrationId}/price-adjustments`).set(headers).send(body);
  const paymentMails = () => mail().sent.filter(({ subject }) => subject.startsWith('Přijali jsme platbu'));

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    await brandOrganisation(app(), organisationId, { bankAccount: '19-2000145399/0800' });
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    const admin = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    adminId = admin.id;
    owner = admin.headers(organisationId);
    registrationId = (
      await submitRegistration(app(), organisationId, campId, {
        turnus: WITH_DEPOSIT,
        paymentChoice: 'deposit',
        secondGuardian: true,
      })
    ).id;
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('owes the Deposit first, then the rest, and tells paid from overpaid as payments are recorded', async () => {
    expect((await ledger()).body).toMatchObject({
      payments: [],
      total: 6500,
      paid: 0,
      balance: 6500,
      status: 'unpaid',
      amountDue: { phase: 'deposit', amount: 2000, dueDate: '2027-04-24' },
      overdue: false,
    });

    expect((await pay({ amount: 2000 })).body).toMatchObject({
      status: 'deposit_paid',
      amountDue: { phase: 'balance', amount: 4500, dueDate: '2027-06-15' },
    });
    expect((await pay({ amount: 5000 })).body).toMatchObject({ status: 'overpaid', balance: -500 });

    const corrected = await pay({ kind: 'correction', amount: 500, note: 'Vráceno' });
    expect(corrected.body).toMatchObject({ status: 'paid', paid: 6500, balance: 0 });
    expect(
      corrected.body.payments.map(({ source, amount }: { source: string; amount: number }) => [source, amount]),
    ).toEqual([
      ['manual', 2000],
      ['manual', 5000],
      ['correction', -500],
    ]);
  });

  it('takes back at most what was paid, and only with a note', async () => {
    await pay({ amount: 2000 });

    const refused = await pay({ kind: 'correction', amount: 2001, note: 'Vráceno' });
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'correction_exceeds_paid' });
    expect((await pay({ kind: 'correction', amount: 500, note: '' })).status).toBe(400);
  });

  it('changes the total by Price adjustments, never below zero', async () => {
    expect((await adjust({ amount: -1500, note: 'Sleva po domluvě' })).body).toMatchObject({
      total: 5000,
      balance: 5000,
      adjustments: [{ amount: -1500, note: 'Sleva po domluvě' }],
    });
    expect((await adjust({ amount: -5000, note: 'Storno bez poplatku' })).body).toMatchObject({ total: 0 });

    const refused = await adjust({ amount: -1, note: 'Ještě sleva' });
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'price_adjustment_below_zero' });
    expect((await adjust({ amount: 0, note: 'Nic' })).status).toBe(400);
  });

  it('is Overdue only once the due date has passed in Prague', async () => {
    clock().set(new Date('2027-04-24T21:59:59Z'));
    // Admin sessions last 12 hours, so the moved Clock needs a new one.
    owner = { ...owner, ...(await signIn(app(), adminId)) };
    expect((await ledger()).body.overdue).toBe(false);

    clock().set(new Date('2027-04-24T22:00:00Z'));
    expect((await ledger()).body.overdue).toBe(true);
  });

  it('keeps the due dates the Registration was submitted with when the Turnus changes them later', async () => {
    const [{ turnus_id: turnusId }] = await query<{ turnus_id: string }>(
      'SELECT turnus_id FROM registrations WHERE id = $1',
      [registrationId],
    );
    const edited = await http()
      .patch(`/api/turnusy/${turnusId}`)
      .set(owner)
      .send({ ...OPEN_TURNUS, ...WITH_DEPOSIT, depositDueDays: 3, balanceDueDate: '2027-05-01' });
    expect(edited.status).toBe(200);

    clock().set(new Date('2027-04-20T10:00:00Z'));
    owner = { ...owner, ...(await signIn(app(), adminId)) };
    expect((await ledger()).body).toMatchObject({
      amountDue: { phase: 'deposit', dueDate: '2027-04-24' },
      overdue: false,
    });
    await pay({ amount: 2000 });
    expect((await ledger()).body.amountDue).toMatchObject({ phase: 'balance', dueDate: '2027-06-15' });

    // A Registration submitted now takes the Turnus as it is now.
    const later = await submitRegistration(app(), organisationId, campId, { turnusId, paymentChoice: 'deposit' });
    expect((await ledger(owner, later.id)).body.amountDue).toMatchObject({ phase: 'deposit', dueDate: '2027-04-23' });
  });

  it('tells partly paid from unpaid, and stays Overdue while the amount due now is not covered', async () => {
    expect((await pay({ amount: 500 })).body).toMatchObject({
      status: 'partly_paid',
      amountDue: { phase: 'deposit', amount: 1500, dueDate: '2027-04-24' },
    });

    clock().set(new Date('2027-04-25T10:00:00Z'));
    owner = { ...owner, ...(await signIn(app(), adminId)) };
    expect((await ledger()).body).toMatchObject({ status: 'partly_paid', overdue: true });
  });

  it('emails both guardians of a payment received, and nobody of a Correcting payment', async () => {
    await pay({ amount: 2000 });
    await jobs().drain();

    expect(paymentMails().map(({ to }) => to)).toEqual([
      ['jana.testovaci@example.com'],
      ['petr.testovaci@example.com'],
    ]);
    expect(paymentMails()[0]?.text).toContain('Částka k úhradě: 4 500 Kč');
    expect(paymentMails()[0]?.text).toContain('Splatnost: 15. 6. 2027');

    await pay({ kind: 'correction', amount: 2000 });
    await jobs().drain();
    expect(paymentMails()).toHaveLength(2);
  });

  it('sends no payment email when the Camp switched it off', async () => {
    await http()
      .put(`/api/camps/${campId}/email-texts/payment_received`)
      .set(owner)
      .send({ subject: 'Platba', text: 'Díky.', enabled: false });

    await pay({ amount: 2000 });
    await jobs().drain();

    expect(paymentMails()).toEqual([]);
  });

  it('audits every entry', async () => {
    await pay({ amount: 2000 });
    await adjust({ amount: 300, note: 'Tričko navíc' });

    expect(
      await query(
        `SELECT action, actor_kind, actor_identity, target_type, changes->'amount'->>'new' AS amount
         FROM audit_entries WHERE target_id = $1 AND action <> $2 ORDER BY id`,
        [registrationId, 'registration.submit'],
      ),
    ).toEqual([
      {
        action: 'payment.create',
        actor_kind: 'admin',
        actor_identity: adminId,
        target_type: 'registration',
        amount: '2000',
      },
      {
        action: 'price_adjustment.create',
        actor_kind: 'admin',
        actor_identity: adminId,
        target_type: 'registration',
        amount: '300',
      },
    ]);
  });

  it('keeps entries for good: the API role can neither change nor remove them', async () => {
    await pay({ amount: 2000 });
    await adjust({ amount: 300, note: 'Tričko navíc' });

    for (const statement of [
      'UPDATE payments SET amount = 1',
      'DELETE FROM payments',
      'DELETE FROM price_adjustments',
    ]) {
      await expect(withClient(database().appUrl, (client) => client.query(statement))).rejects.toThrow(
        /permission denied/,
      );
    }
  });

  it('refuses a company payment on a Registration without an Invoice request', async () => {
    const refused = await pay({ amount: 1000, payer: 'company' });

    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('company_payment_unavailable');
    expect((await ledger()).body.payments).toEqual([]);
  });

  it("records the company's payments apart from the guardian's, so each share shows what is left", async () => {
    await offerInvoiceRequests(app(), organisationId, campId);
    registrationId = (
      await submitRegistration(app(), organisationId, campId, {
        turnus: WITH_DEPOSIT,
        paymentChoice: 'deposit',
        invoiceRequest: { ...FAKE_INVOICE_REQUEST, amount: 4000 },
      })
    ).id;

    const paid = await pay({ amount: 4000, payer: 'company' });

    expect(paid.status).toBe(201);
    expect(paid.body).toMatchObject({
      payments: [{ source: 'manual', payer: 'company', amount: 4000 }],
      status: 'deposit_paid',
      amountDue: { phase: 'deposit', amount: 2000 },
      guardian: { share: 2500, paid: 0, balance: 2500 },
      company: { invoiced: 4000, paid: 4000, balance: 0 },
    });

    const overCorrected = await pay({ kind: 'correction', amount: 1, note: 'Vráceno', payer: 'guardian' });
    expect(overCorrected.body.code).toBe('correction_exceeds_paid');

    expect((await pay({ amount: 2500 })).body).toMatchObject({
      status: 'paid',
      amountDue: { phase: 'settled', amount: 0 },
      guardian: { balance: 0 },
    });
  });

  it("keeps every gateway entry the guardian's", async () => {
    await expect(
      query(
        `INSERT INTO payments (organisation_id, registration_id, source, payer, amount, paid_on, note, recorded_at, gateway_transaction_id)
         VALUES ($1, $2, 'gateway', 'company', 100, '2027-04-10', 'Platba kartou', now(), 'TX-1')`,
        [organisationId, registrationId],
      ),
    ).rejects.toThrow(/payments_gateway_payer/);
  });

  it('takes Registrations read to see the ledger and write to add to it', async () => {
    await expectPermission(['registrations', 'read'], organisationId, (headers) => ledger(headers));
    await expectPermission(['registrations', 'write'], organisationId, (headers) => pay({ amount: 100 }, headers));
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      adjust({ amount: 100, note: 'Příplatek' }, headers),
    );
  });

  it("keeps another Organisation's admins away from the ledger", async () => {
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectIsolated(() => ledger(asOther));
    await expectIsolated(() => pay({ amount: 100 }, asOther));
    await expectIsolated(() =>
      http()
        .post(`/api/registrations/${registrationId}/price-adjustments`)
        .set(asOther)
        .send({ amount: 100, note: 'Příplatek' }),
    );
  });
});
