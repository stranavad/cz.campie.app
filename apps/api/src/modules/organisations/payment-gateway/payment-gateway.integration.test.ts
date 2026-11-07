import { beforeEach, describe, expect, it } from 'vitest';

import { createAdmin, createOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const SECRET = 'comgate-test-secret-1';

describe('payment gateway keys', () => {
  const { app, http, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const setKeys = (headers: RequestHeaders, body: object = { merchantId: '123456', secret: SECRET }) =>
    http().put('/api/organisation-settings/payment-gateway').set(headers).send(body);

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
  });

  it('stores the keys encrypted and never shows or audits the secret', async () => {
    const saved = await setKeys(owner);
    const shown = await http().get('/api/organisation-settings/payment-gateway').set(owner);

    expect(saved.body).toEqual({ merchantId: '123456' });
    expect(shown.body).toEqual({ merchantId: '123456' });
    const [row] = await query<{ secret: Buffer }>('SELECT secret FROM payment_gateway_accounts');
    expect(row?.secret.toString('latin1')).not.toContain(SECRET);
    const audit = await query<{ action: string; changes: unknown }>('SELECT action, changes FROM audit_entries');
    expect(audit.map(({ action }) => action)).toEqual(['payment_gateway.update']);
    expect(JSON.stringify(audit)).not.toContain(SECRET);
  });

  it('removes the keys, which leaves bank transfer only', async () => {
    await setKeys(owner);

    const removed = await http().delete('/api/organisation-settings/payment-gateway').set(owner);

    expect(removed.body).toEqual({ merchantId: null });
    expect(await query('SELECT FROM payment_gateway_accounts')).toEqual([]);
    expect(await query(`SELECT FROM audit_entries WHERE action = 'payment_gateway.remove'`)).toHaveLength(1);
  });

  it('refuses a merchant id Comgate never issues', async () => {
    expect((await setKeys(owner, { merchantId: 'abc', secret: SECRET })).status).toBe(400);
  });

  it('is for Owners only, and keeps another Organisation away', async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    await expectPermission(['owner'], organisationId, (headers) => setKeys(headers));
    await expectIsolated(() => setKeys(otherOwner.headers(organisationId)));
  });
});
