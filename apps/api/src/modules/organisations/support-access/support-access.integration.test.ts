import { beforeEach, describe, expect, it } from 'vitest';

import type { Account } from '@repo/schema/admins';
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
  const enter = () => http().post('/api/support-access/enter').set(asOperator());
  const leave = (headers: RequestHeaders = asOperator()) => http().post('/api/support-access/leave').set(headers);
  const supportLog = async (inOrganisation: string) =>
    (
      await query<{ action: string; actor_kind: string }>(
        `SELECT action, actor_kind FROM audit_entries WHERE organisation_id = $1 AND action LIKE 'support_access.%' ORDER BY occurred_at, id`,
        [inOrganisation],
      )
    ).map(({ action, actor_kind }) => `${action} ${actor_kind}`);
  const entered = async () =>
    Object.fromEntries(
      ((await http().get('/api/account').set(operator)).body.memberships as Account['memberships']).map(
        ({ organisation, support }) => [organisation.id, support?.entered],
      ),
    );
  // Another Organisation with a grant in force for two hours, as the operator acts in it.
  const another = async () => {
    const id = await createOrganisation(app());
    const anotherOwner = (await createAdmin(app(), { memberOf: [id], owner: true })).headers(id);
    await http().post('/api/support-access').set(anotherOwner).send({ hours: 2 });

    return { id, owner: anotherOwner, asOperator: { ...operator, [ACCESS_HEADERS.organisation]: id } };
  };
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

  it('lets the operator in only after entering, and entering again while in records nothing', async () => {
    await grant({ hours: 2 });

    const refused = await read();
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('support_entry_required');

    expect((await enter()).status).toBe(204);
    expect((await enter()).status).toBe(204);
    expect((await read()).status).toBe(200);
    expect(await query(`SELECT action FROM audit_entries WHERE action = 'support_access.enter'`)).toHaveLength(1);
  });

  it('lets the operator read but change nothing under a read-only grant', async () => {
    await grant({ hours: 2 });
    await enter();

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
        support: { allowWrites: true, expiresAt: '2027-04-10T12:00:00.000Z', entered: false },
      }),
    ]);
    expect((await http().post('/api/support-access/enter').set(asOperator())).status).toBe(204);
    expect((await http().get('/api/account').set(operator)).body.memberships[0].support.entered).toBe(true);
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
    await enter();
    expect((await read()).status).toBe(200);

    clock().set(new Date('2027-04-10T11:00:01Z'));
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    expect((await read()).status).toBe(403);

    await grant({ hours: 3 });
    expect((await read()).body.code).toBe('support_entry_required');
    await enter();
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
    ).toEqual([
      'support_access.grant',
      'support_access.enter',
      'support_access.grant',
      'support_access.enter',
      'support_access.revoke',
    ]);
  });

  it('ends access when the operator leaves, though the grant runs on', async () => {
    await grant({ hours: 2 });
    await enter();

    expect((await leave()).status).toBe(204);

    const refused = await read();
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('support_entry_required');
  });

  it('records leaving once, as the operator, under a read-only grant', async () => {
    await grant({ hours: 2 });
    await enter();

    expect((await leave()).status).toBe(204);
    expect((await leave()).status).toBe(204);

    expect(await supportLog(organisationId)).toEqual([
      'support_access.grant admin',
      'support_access.enter operator',
      'support_access.leave operator',
    ]);
  });

  it('opens a new visit on entering again after leaving', async () => {
    await grant({ hours: 2 });
    await enter();
    await leave();

    expect((await enter()).status).toBe(204);

    expect((await read()).status).toBe(200);
    expect(await supportLog(organisationId)).toEqual([
      'support_access.grant admin',
      'support_access.enter operator',
      'support_access.leave operator',
      'support_access.enter operator',
    ]);
  });

  it('keeps the operator in one Organisation at a time, each logging only its own visits', async () => {
    await grant({ hours: 2 });
    const second = await another();
    await enter();

    const refused = await http().post('/api/support-access/enter').set(second.asOperator);
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('support_visit_open');
    expect(await entered()).toEqual({ [organisationId]: true, [second.id]: false });

    await leave();
    expect((await http().post('/api/support-access/enter').set(second.asOperator)).status).toBe(204);

    expect(await entered()).toEqual({ [organisationId]: false, [second.id]: true });
    expect(await supportLog(organisationId)).toEqual([
      'support_access.grant admin',
      'support_access.enter operator',
      'support_access.leave operator',
    ]);
    expect(await supportLog(second.id)).toEqual(['support_access.grant admin', 'support_access.enter operator']);
  });

  it('lets a visit under a revoked grant not keep the operator from another Organisation', async () => {
    await grant({ hours: 2 });
    const second = await another();
    await enter();
    const [active] = (await http().get('/api/support-access').set(owner)).body as { id: string }[];
    await http().delete(`/api/support-access/${active?.id}`).set(owner);

    expect((await http().post('/api/support-access/enter').set(second.asOperator)).status).toBe(204);
  });

  it('lets a visit under an expired grant not keep the operator from another Organisation', async () => {
    await grant({ hours: 1 });
    const second = await another();
    await enter();
    clock().set(new Date('2027-04-10T11:00:01Z'));

    expect((await http().post('/api/support-access/enter').set(second.asOperator)).status).toBe(204);
    expect(await entered()).toEqual({ [second.id]: true });
  });

  it('refuses leaving to members', async () => {
    await grant({ hours: 2 });

    expect((await leave(owner)).status).toBe(403);
  });

  it('lists each grant, newest first, with the Owner who granted it, and none of another Organisation', async () => {
    const named = await createAdmin(app(), {
      memberOf: [organisationId],
      owner: true,
      name: { firstName: 'Jana', lastName: 'Zkušební' },
    });
    await grant({ hours: 1 });
    clock().advance(60 * 1000);
    await http().post('/api/support-access').set(named.headers(organisationId)).send({ hours: 2 });
    const otherOrganisation = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), {
      memberOf: [otherOrganisation],
      owner: true,
      name: { firstName: 'Ota', lastName: 'Jinde' },
    });

    const listed = await http().get('/api/support-access').set(owner);

    expect(listed.body).toEqual([
      expect.objectContaining({
        active: true,
        grantedBy: { email: named.email, firstName: 'Jana', lastName: 'Zkušební' },
      }),
      expect.objectContaining({
        active: false,
        grantedBy: { email: expect.stringMatching(/@example\.com$/), firstName: null, lastName: null },
      }),
    ]);
    expect((await http().get('/api/support-access').set(otherOwner.headers(otherOrganisation))).body).toEqual([]);
  });

  it('lets only Owners grant', async () => {
    await expectPermission(['owner'], organisationId, (headers) =>
      http().post('/api/support-access').set(headers).send({ hours: 1 }),
    );
  });
});
