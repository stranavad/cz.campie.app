import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  organisationHost,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const KEYS_A = { merchantId: '111111', secret: 'comgate-secret-of-a' };
const KEYS_B = { merchantId: '222222', secret: 'comgate-secret-of-b' };
// A Turnus with a Deposit, so the amount due now differs from the whole.
const WITH_DEPOSIT = { basePrice: 6500, deposit: 2000, depositDueDays: 14, balanceDueDate: '2027-06-15' };

describe('card payments through Comgate', () => {
  const { app, http, clock, database, jobs, mail, payments, expectIsolated } = useTestApp();

  let organisationA: string;
  let organisationB: string;
  let hostA: { Host: string };
  let registrationId: string;
  let idempotencyKey: string;
  let guardianEmail: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const ownerOf = async (organisationId: string): Promise<RequestHeaders> =>
    (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
  const startAfterSubmission = (key = idempotencyKey) =>
    http().post('/api/card-payments').set(hostA).set('x-csrf-protection', '1').send({ idempotencyKey: key });
  const startedTransaction = async () => {
    await startAfterSubmission();

    return payments().created.at(-1)?.transactionId ?? '';
  };
  const notify = (organisationId: string, transId: string) =>
    http().post(`/api/webhooks/comgate/${organisationId}`).type('form').send({ transId, status: 'PAID' });
  const result = (transactionId: string) => http().get(`/api/card-payments/${transactionId}`).set(hostA);
  const gatewayEntries = () =>
    query<{ organisation_id: string; amount: number; gateway_transaction_id: string }>(
      `SELECT organisation_id, amount, gateway_transaction_id FROM payments WHERE source = 'gateway'`,
    );

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationA = await createOrganisation(app());
    organisationB = await createOrganisation(app());
    hostA = { Host: await organisationHost(app(), organisationA) };
    await http()
      .put('/api/organisation-settings/payment-gateway')
      .set(await ownerOf(organisationA))
      .send(KEYS_A);
    await http()
      .put('/api/organisation-settings/payment-gateway')
      .set(await ownerOf(organisationB))
      .send(KEYS_B);
    const campId = await createCamp(app(), organisationA, 'Letní tábor', 'letni-tabor');
    registrationId = (
      await submitRegistration(app(), organisationA, campId, { turnus: WITH_DEPOSIT, paymentChoice: 'deposit' })
    ).id;
    const [row] = await query<{ idempotency_key: string; email: string }>(
      `SELECT r.idempotency_key, g.email FROM registrations r
       JOIN registration_guardians g ON g.registration_id = r.id AND g.position = 1 WHERE r.id = $1`,
      [registrationId],
    );
    idempotencyKey = row?.idempotency_key ?? '';
    guardianEmail = row?.email ?? '';
    await jobs().drain();
    mail().sent.length = 0;
  });

  describe('starting one', () => {
    it('sends the guardian to Comgate for the amount due now, with the keys of its Organisation', async () => {
      const response = await startAfterSubmission();

      expect(response.status).toBe(201);
      expect(response.body.redirectUrl).toMatch(/^https:/);
      expect(payments().created.at(-1)?.input).toMatchObject({
        credentials: KEYS_A,
        referenceId: registrationId,
        amountCzk: 2000,
        returnUrl: `https://${hostA.Host}/platba?id=\${id}`,
      });
    });

    it('keeps the Registration and bank transfer when Comgate fails', async () => {
      payments().failing = true;

      const response = await startAfterSubmission();

      expect(response.status).toBe(503);
      expect(response.body.code).toBe('card_payment_unavailable');
      expect(await query('SELECT FROM registrations WHERE id = $1', [registrationId])).toHaveLength(1);
    });

    it('refuses for an unknown submission, a day after it, and without keys, when the form offers no card', async () => {
      expect((await startAfterSubmission('0190a2b4-0000-7000-8000-00000000dead')).status).toBe(404);

      clock().set(new Date('2027-04-11T10:00:01Z'));
      expect((await startAfterSubmission()).status).toBe(404);

      clock().set(new Date('2027-04-10T10:00:00Z'));
      const offered = async () => (await http().get('/api/public-camps/letni-tabor').set(hostA)).body.cardPayments;
      expect(await offered()).toBe(true);
      await http()
        .delete('/api/organisation-settings/payment-gateway')
        .set(await ownerOf(organisationA));
      expect(await offered()).toBe(false);
      expect((await startAfterSubmission()).body.code).toBe('card_payment_unavailable');
    });

    it('lets a guardian pay the amount due now or everything outstanding from the portal', async () => {
      const guardian = (await createGuardianSession(app(), organisationA, guardianEmail)).headers;
      const pay = (amount: string) =>
        http().post(`/api/portal/registrations/${registrationId}/card-payment`).set(guardian).send({ amount });

      expect((await pay('due_now')).status).toBe(201);
      expect(payments().created.at(-1)?.input.amountCzk).toBe(2000);
      expect((await pay('balance')).status).toBe(201);
      expect(payments().created.at(-1)?.input.amountCzk).toBe(6500);

      const stranger = (await createGuardianSession(app(), organisationA, 'jiny.rodic@example.test')).headers;
      expect(
        (
          await http()
            .post(`/api/portal/registrations/${registrationId}/card-payment`)
            .set(stranger)
            .send({ amount: 'due_now' })
        ).status,
      ).toBe(404);
    });

    it('offers nothing once everything is paid', async () => {
      const guardian = (await createGuardianSession(app(), organisationA, guardianEmail)).headers;
      await http()
        .post(`/api/registrations/${registrationId}/payments`)
        .set(await ownerOf(organisationA))
        .send({ kind: 'payment', amount: 6500, paidOn: '2027-04-10', note: 'Převodem' });

      const response = await http()
        .post(`/api/portal/registrations/${registrationId}/card-payment`)
        .set(guardian)
        .send({ amount: 'balance' });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('card_payment_nothing_due');
    });

    it('keeps a guardian of another Organisation away', async () => {
      const otherGuardian = (await createGuardianSession(app(), organisationB, guardianEmail)).headers;

      await expectIsolated(() =>
        http()
          .post(`/api/portal/registrations/${registrationId}/card-payment`)
          .set(otherGuardian)
          .send({ amount: 'due_now' }),
      );
    });
  });

  describe('notifications', () => {
    it('records a verified paid transaction once, audited as the system, and emails the guardian', async () => {
      const transactionId = await startedTransaction();
      payments().settle(transactionId, 'paid');

      expect((await notify(organisationA, transactionId)).status).toBe(200);
      expect((await notify(organisationA, transactionId)).status).toBe(200);

      expect(await gatewayEntries()).toEqual([
        { organisation_id: organisationA, amount: 2000, gateway_transaction_id: transactionId },
      ]);
      const audit = await query<{ actor_kind: string; transaction: string }>(
        `SELECT actor_kind, changes->'gatewayTransactionId'->>'new' AS transaction FROM audit_entries
         WHERE action = 'payment.create'`,
      );
      expect(audit).toEqual([{ actor_kind: 'system', transaction: transactionId }]);
      await jobs().drain();
      expect(mail().sent.filter(({ subject }) => subject.startsWith('Přijali jsme platbu'))).toHaveLength(1);
    });

    it('records nothing for a transaction pending, cancelled or unknown to Comgate', async () => {
      const pending = await startedTransaction();
      const cancelled = await startedTransaction();
      payments().settle(cancelled, 'cancelled');

      await notify(organisationA, pending);
      await notify(organisationA, cancelled);
      await notify(organisationA, 'UNKNOWN-1234');

      expect(await gatewayEntries()).toEqual([]);
    });

    it('records nothing when the address of Organisation B is told of a transaction of A', async () => {
      const transactionId = await startedTransaction();
      payments().settle(transactionId, 'paid');

      expect((await notify(organisationB, transactionId)).status).toBe(200);

      expect(await gatewayEntries()).toEqual([]);
    });

    it('ignores an Organisation without keys, and an address of no Organisation', async () => {
      await http()
        .delete('/api/organisation-settings/payment-gateway')
        .set(await ownerOf(organisationA));

      expect((await notify(organisationA, 'AB12-CD34-EF56')).status).toBe(200);
      expect((await notify('01900000-0000-7000-8000-000000000000', 'AB12-CD34-EF56')).status).toBe(404);
    });
  });

  describe('the page Comgate sends the guardian back to', () => {
    it('shows pending, then paid, recorded once even before the notification, or failed once cancelled', async () => {
      const paid = await startedTransaction();
      const cancelled = await startedTransaction();

      expect((await result(paid)).body).toMatchObject({ state: 'pending', campName: 'Letní tábor' });
      payments().settle(paid, 'paid');
      expect((await result(paid)).body.state).toBe('paid');
      await notify(organisationA, paid);
      expect((await result(paid)).body.state).toBe('paid');
      expect(await gatewayEntries()).toHaveLength(1);
      payments().settle(cancelled, 'cancelled');
      expect((await result(cancelled)).body.state).toBe('failed');
    });

    it('knows no transaction of another Organisation', async () => {
      const transactionId = await startedTransaction();
      const hostB = { Host: await organisationHost(app(), organisationB) };

      expect((await http().get(`/api/card-payments/${transactionId}`).set(hostB)).status).toBe(404);
    });
  });
});
