import { beforeEach, describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { createAdmin, createCamp, createOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
import { createOperator } from '../../../testing/operator.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

describe('support access', () => {
  const testApp = useTestApp();
  const { app, http, clock, database, expectPermission } = testApp;

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let operator: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const grant = (body: object) => http().post('/api/support-access').set(owner).send(body);
  const asOperator = () => ({ ...operator, [ACCESS_HEADERS.organisation]: organisationId });
  const read = () => http().get(`/api/camps/${campId}`).set(asOperator());
  const write = () => http().patch(`/api/camps/${campId}`).set(asOperator()).send({ name: 'Upraveno podporou' });

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    operator = (await createOperator(testApp)).headers;
  });

  it('keeps the operator out without a grant', async () => {
    expect((await read()).status).toBe(403);
    expect((await http().post('/api/support-access/enter').set(asOperator())).status).toBe(403);
  });

  it('lets the operator read but change nothing under a read-only grant', async () => {
    await grant({ hours: 2 });

    expect((await read()).status).toBe(200);
    expect((await write()).status).toBe(403);
    // A change a read permission allows, such as an export, is refused too.
    expect((await http().post('/api/payment-exports').set(asOperator())).body.code).toBe('support_read_only');
    expect((await http().get('/api/support-access').set(asOperator())).status).toBe(403);
  });

  it('lets the operator change things under a write grant, audited as the operator', async () => {
    await grant({ hours: 2, allowWrites: true });

    expect((await http().get('/api/account').set(operator)).body.memberships).toEqual([
      expect.objectContaining({
        organisation: expect.objectContaining({ id: organisationId }),
        owner: false,
        support: { allowWrites: true, expiresAt: '2027-04-10T12:00:00.000Z' },
      }),
    ]);
    expect((await http().post('/api/support-access/enter').set(asOperator())).status).toBe(204);
    expect((await write()).status).toBe(200);
    expect(
      await query(
        `SELECT action, actor_kind FROM audit_entries WHERE action IN ('camp.update', 'support_access.enter') ORDER BY occurred_at, id`,
      ),
    ).toEqual([
      { action: 'support_access.enter', actor_kind: 'operator' },
      { action: 'camp.update', actor_kind: 'operator' },
    ]);
  });

  it('ends access when the grant expires or is revoked, each audited', async () => {
    const granted = await grant({ hours: 1 });
    expect((await read()).status).toBe(200);

    clock().set(new Date('2027-04-10T11:00:01Z'));
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    expect((await read()).status).toBe(403);

    await grant({ hours: 3 });
    expect((await read()).status).toBe(200);
    const [active] = (await http().get('/api/support-access').set(owner)).body as { id: string }[];
    await http().delete(`/api/support-access/${active?.id}`).set(owner);
    expect((await read()).status).toBe(403);

    expect(granted.body.expiresAt).toBe('2027-04-10T11:00:00.000Z');
    expect(
      (
        await query<{ action: string }>(
          `SELECT action FROM audit_entries WHERE action LIKE 'support_access.%' ORDER BY occurred_at, id`,
        )
      ).map(({ action }) => action),
    ).toEqual(['support_access.grant', 'support_access.grant', 'support_access.revoke']);
  });

  it('lets only Owners grant', async () => {
    await expectPermission(['owner'], organisationId, (headers) =>
      http().post('/api/support-access').set(headers).send({ hours: 1 }),
    );
  });
});
