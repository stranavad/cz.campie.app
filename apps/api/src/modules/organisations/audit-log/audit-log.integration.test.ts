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

describe('audit log', () => {
  const { app, http, database } = useTestApp();

  let organisationId: string;
  let owner: Awaited<ReturnType<typeof createAdmin>>;
  let headers: RequestHeaders;
  let registrationId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const log = (filters: Record<string, string> = {}, as = headers) =>
    http().get('/api/audit-log').query(filters).set(as);

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    headers = owner.headers(organisationId);
    const campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
    await http()
      .put('/api/organisation-settings/payment-gateway')
      .set(headers)
      .send({ merchantId: '123456', secret: 'comgate-test-secret-1' });
  });

  it('shows the Owner every entry with plain values, and encrypted fields by name only', async () => {
    const response = await log({ action: 'payment_gateway.' });

    expect(response.body.entries).toEqual([
      expect.objectContaining({
        action: 'payment_gateway.update',
        actor: { kind: 'admin', name: owner.email },
        target: { type: 'organisation', id: organisationId },
        encryptedFields: ['secret'],
      }),
    ]);
    expect(JSON.stringify(response.body)).not.toContain('comgate-test-secret-1');
    expect(response.body.entries[0].changes.merchantId).toEqual({ old: null, new: '123456' });
  });

  it('filters by actor, kind, target and time, and pages through', async () => {
    await query(
      `INSERT INTO audit_entries (organisation_id, occurred_at, actor_kind, action, target_type, target_id)
       SELECT $1, timestamptz '2027-01-01T00:00:00Z' + n * interval '1 minute', 'system', 'test.tick', 'test', $2
       FROM generate_series(1, 60) n`,
      [organisationId, registrationId],
    );

    const first = await log({ actorKind: 'system', action: 'test.' });
    const second = await log({ actorKind: 'system', action: 'test.', after: first.body.next });

    expect(first.body.entries).toHaveLength(50);
    expect(second.body.entries).toHaveLength(10);
    expect(second.body.next).toBeNull();
    expect(
      (await log({ actor: owner.email })).body.entries.every(
        ({ actor }: { actor: { name: string } }) => actor.name === owner.email,
      ),
    ).toBe(true);
    expect(
      (await log({ targetId: registrationId, from: '2027-01-01T00:59:30Z', to: '2027-01-01T01:00:30Z' })).body.entries,
    ).toHaveLength(1);
  });

  it('keeps the log to Owners and to the Organisation, and record history to those who read the record', async () => {
    const reader = (
      await createAdmin(app(), { memberOf: [organisationId], permissions: { registrations: 'read' } })
    ).headers(organisationId);
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);
    const [participant] = await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [
      registrationId,
    ]);
    await query(
      `INSERT INTO audit_entries (organisation_id, occurred_at, actor_kind, actor_identity, action, target_type, target_id)
       VALUES ($1, now(), 'admin', $2, 'health_record.view', 'participant', $3)`,
      [organisationId, owner.id, participant?.id],
    );

    expect((await log({}, reader)).status).toBe(403);
    const history = (await http().get(`/api/registrations/${registrationId}/history`).set(reader)).body as {
      action: string;
    }[];
    expect(history.length).toBeGreaterThan(0);
    expect(history.map(({ action }) => action)).not.toContain('health_record.view');
    expect(
      (
        (await http().get(`/api/registrations/${registrationId}/history`).set(headers)).body as { action: string }[]
      ).map(({ action }) => action),
    ).toContain('health_record.view');
    expect((await log({ targetId: registrationId }, otherOwner)).body.entries).toEqual([]);
  });
});
