import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import {
  createAdmin,
  createCamp,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { CardPaymentService } from './services/card-payment.service.ts';

const KEYS_A = { merchantId: '111111', secret: 'comgate-secret-of-a' };
const KEYS_B = { merchantId: '222222', secret: 'comgate-secret-of-b' };

describe('card payments through Comgate', () => {
  const { app, http, clock, database, jobs, mail, payments } = useTestApp();

  let organisationA: string;
  let organisationB: string;
  let registrationId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const ownerOf = async (organisationId: string): Promise<RequestHeaders> =>
    (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
  const createPayment = (organisationId: string, amountCzk: number) =>
    app()
      .get(UnitOfWork)
      .run(organisationId, () => app().get(CardPaymentService).create(registrationId, amountCzk));
  const notify = (organisationId: string, transId: string) =>
    http().post(`/api/webhooks/comgate/${organisationId}`).type('form').send({ transId, status: 'PAID' });
  const gatewayEntries = () =>
    query<{ organisation_id: string; amount: number; gateway_transaction_id: string }>(
      `SELECT organisation_id, amount, gateway_transaction_id FROM payments WHERE source = 'gateway'`,
    );

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationA = await createOrganisation(app());
    organisationB = await createOrganisation(app());
    await http()
      .put('/api/organisation-settings/payment-gateway')
      .set(await ownerOf(organisationA))
      .send(KEYS_A);
    await http()
      .put('/api/organisation-settings/payment-gateway')
      .set(await ownerOf(organisationB))
      .send(KEYS_B);
    const campId = await createCamp(app(), organisationA, 'Letní tábor', 'letni-tabor');
    registrationId = (await submitRegistration(app(), organisationA, campId)).id;
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('creates a payment with the keys of the Organisation of the Registration', async () => {
    const created = await createPayment(organisationA, 2000);

    expect(created?.redirectUrl).toMatch(/^https:/);
    expect(payments().created.at(-1)?.input).toMatchObject({
      credentials: KEYS_A,
      referenceId: registrationId,
      amountCzk: 2000,
    });
  });

  it('records a verified paid transaction once, audited as the system, and emails the guardian', async () => {
    const created = await createPayment(organisationA, 2000);
    payments().settle(created?.transactionId ?? '', 'paid');

    expect((await notify(organisationA, created?.transactionId ?? '')).status).toBe(200);
    expect((await notify(organisationA, created?.transactionId ?? '')).status).toBe(200);

    expect(await gatewayEntries()).toEqual([
      { organisation_id: organisationA, amount: 2000, gateway_transaction_id: created?.transactionId },
    ]);
    const audit = await query<{ actor_kind: string; transaction: string }>(
      `SELECT actor_kind, changes->'gatewayTransactionId'->>'new' AS transaction FROM audit_entries
       WHERE action = 'payment.create'`,
    );
    expect(audit).toEqual([{ actor_kind: 'system', transaction: created?.transactionId }]);
    await jobs().drain();
    expect(mail().sent.filter(({ subject }) => subject.startsWith('Přijali jsme platbu'))).toHaveLength(1);
  });

  it('records nothing for a transaction pending, cancelled or unknown to Comgate', async () => {
    const pending = await createPayment(organisationA, 2000);
    const cancelled = await createPayment(organisationA, 2000);
    payments().settle(cancelled?.transactionId ?? '', 'cancelled');

    await notify(organisationA, pending?.transactionId ?? '');
    await notify(organisationA, cancelled?.transactionId ?? '');
    await notify(organisationA, 'UNKNOWN-1234');

    expect(await gatewayEntries()).toEqual([]);
  });

  it('records nothing when the address of Organisation B is told of a transaction of A', async () => {
    const created = await createPayment(organisationA, 2000);
    payments().settle(created?.transactionId ?? '', 'paid');

    expect((await notify(organisationB, created?.transactionId ?? '')).status).toBe(200);

    expect(await gatewayEntries()).toEqual([]);
  });

  it('ignores an Organisation without keys, and an address of no Organisation', async () => {
    await http()
      .delete('/api/organisation-settings/payment-gateway')
      .set(await ownerOf(organisationA));

    expect(await createPayment(organisationA, 2000)).toBeNull();
    expect((await notify(organisationA, 'AB12-CD34-EF56')).status).toBe(200);
    expect((await notify('01900000-0000-7000-8000-000000000000', 'AB12-CD34-EF56')).status).toBe(404);
  });
});
