import { beforeEach, describe, expect, it } from 'vitest';

import type { AuditEntry } from '@repo/schema/audit';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  OPEN_TURNUS,
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
  let campId: string;
  let registrationId: string;
  let variableSymbol: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const log = (filters: Record<string, string> = {}, as = headers) =>
    http().get('/api/audit-log').query(filters).set(as);
  const entries = async (filters: Record<string, string> = {}, as = headers) =>
    (await log(filters, as)).body.entries as AuditEntry[];

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    headers = owner.headers(organisationId);
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    ({ id: registrationId, variableSymbol } = await submitRegistration(app(), organisationId, campId));
    await http()
      .put('/api/organisation-settings/payment-gateway')
      .set(headers)
      .send({ merchantId: '123456', secret: 'comgate-test-secret-1' });
  });

  it('shows the Owner every entry with plain values, and encrypted fields by name only', async () => {
    const response = await log({ area: 'organisation' });

    expect(response.body.entries).toEqual([
      expect.objectContaining({
        action: 'payment_gateway.update',
        actor: { kind: 'admin', name: owner.email },
        encryptedFields: [{ field: 'secret', label: null, labelKey: null }],
      }),
    ]);
    expect(JSON.stringify(response.body)).not.toContain('comgate-test-secret-1');
    expect(response.body.entries[0].changes.merchantId).toEqual({ old: null, new: '123456' });
  });

  it('records changes without ids, the Organisation or timestamps', async () => {
    await http()
      .post(`/api/registrations/${registrationId}/payments`)
      .set(headers)
      .send({ kind: 'payment', amount: 1000, paidOn: '2027-04-10', note: 'Hotově' });
    await http()
      .post(`/api/camps/${campId}/document-types`)
      .set(headers)
      .send({ kind: 'requirement', name: 'Potvrzení od lékaře', description: '', dueDate: null, turnusIds: [] });

    const recorded = await entries();
    const fields = recorded.flatMap(({ changes }) => Object.keys(changes ?? {}));

    expect(recorded.map(({ action }) => action)).toEqual(
      expect.arrayContaining(['camp.create', 'turnus.create', 'payment.create', 'document_type.create']),
    );
    expect(fields).toEqual(expect.arrayContaining(['name', 'amount', 'merchantId']));
    expect(fields.filter((field) => /^(id|organisationId|createdAt|updatedAt)$|[a-z]Id$/.test(field))).toEqual([
      'merchantId',
    ]);
  });

  it('names each record as it is now, linked where it has a page', async () => {
    const recorded = await entries();
    const targetOf = (action: string) => recorded.find((entry) => entry.action === action)?.target;

    expect(targetOf('camp.create')).toEqual({
      type: 'camp',
      id: campId,
      label: 'Letní tábor',
      variableSymbol: null,
      state: 'present',
      link: { page: 'camp', campId },
    });
    expect(targetOf('turnus.create')).toMatchObject({ type: 'turnus', label: OPEN_TURNUS.name, state: 'present' });
    expect(targetOf('registration.submit')).toEqual({
      type: 'registration',
      id: registrationId,
      label: 'Ema Testovací',
      variableSymbol,
      state: 'present',
      link: { page: 'registration', registrationId },
    });
    expect(targetOf('payment_gateway.update')).toMatchObject({ type: 'organisation', state: 'present' });
    expect(targetOf('payment_gateway.update')?.label).toEqual(expect.any(String));
  });

  it('shows a removed record by its kind, and an Erased Registration without its personal data', async () => {
    const turnus = await http()
      .post(`/api/camps/${campId}/turnusy`)
      .set(headers)
      .send({ ...OPEN_TURNUS, name: 'Turnus navíc' });
    await http().delete(`/api/turnusy/${turnus.body.id}`).set(headers).expect(204);
    await http().post(`/api/registrations/${registrationId}/erase`).set(headers).expect(204);

    const removed = (await entries({ area: 'turnusy' })).filter(({ target }) => target.id === turnus.body.id);
    const erased = await entries({ area: 'registrations' });

    expect(removed.map(({ action, target }) => [action, target.state, target.label])).toEqual([
      ['turnus.remove', 'removed', null],
      ['turnus.create', 'removed', null],
    ]);
    expect(erased.map(({ action }) => action)).toEqual(expect.arrayContaining(['registration.erase']));
    expect(erased.filter(({ target }) => target.id === registrationId)).not.toEqual([]);
    expect(
      erased.every(
        ({ target }) => target.state === 'erased' && target.label === null && target.variableSymbol === null,
      ),
    ).toBe(true);
    expect(JSON.stringify(erased)).not.toMatch(/Ema|Testovací|jana\.testovaci/);
  });

  it("never names a record of another Organisation in an entry of this one's", async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);
    await query(
      `INSERT INTO audit_entries (organisation_id, occurred_at, actor_kind, action, target_type, target_id)
       VALUES ($1, now(), 'system', 'camp.update', 'camp', $2),
              ($1, now(), 'system', 'registration.edit', 'registration', $3),
              ($1, now(), 'system', 'organisation.update', 'organisation', $4)`,
      [otherId, campId, registrationId, organisationId],
    );

    const forged = (await entries({}, otherOwner)).filter(({ target }) =>
      [campId, registrationId, organisationId].includes(target.id),
    );

    expect(forged.map(({ target }) => target).toSorted((a, b) => a.type.localeCompare(b.type))).toEqual([
      expect.objectContaining({ type: 'camp', label: null, state: 'removed', link: null }),
      expect.objectContaining({ type: 'organisation', label: null, state: 'removed', link: null }),
      expect.objectContaining({ type: 'registration', label: null, state: 'removed', link: null }),
    ]);
  });

  it('filters by area to exactly its actions', async () => {
    const turnusy = await entries({ area: 'turnusy' });
    const organisation = await entries({ area: 'organisation' });

    expect(turnusy.map(({ action }) => action)).toEqual(['turnus.create']);
    expect(organisation.map(({ action }) => action)).toEqual(['payment_gateway.update']);
    expect((await log({ area: 'nonsense' })).status).toBe(400);
  });

  it('filters by actor, kind, target and time, and pages through', async () => {
    const [turnus] = await query<{ id: string }>('SELECT id FROM turnusy');
    await query(
      `INSERT INTO audit_entries (organisation_id, occurred_at, actor_kind, action, target_type, target_id)
       SELECT $1, timestamptz '2027-01-01T00:00:00Z' + n * interval '1 minute', 'system', 'turnus.update', 'turnus', $2
       FROM generate_series(1, 60) n`,
      [organisationId, turnus?.id],
    );

    const first = await log({ actorKind: 'system', area: 'turnusy' });
    const second = await log({ actorKind: 'system', area: 'turnusy', after: first.body.next });

    expect(first.body.entries).toHaveLength(50);
    expect(second.body.entries).toHaveLength(11);
    expect(second.body.next).toBeNull();
    expect(
      (await log({ actor: owner.email })).body.entries.every(
        ({ actor }: { actor: { name: string } }) => actor.name === owner.email,
      ),
    ).toBe(true);
    expect(
      (await log({ targetId: turnus?.id ?? '', from: '2027-01-01T00:59:30Z', to: '2027-01-01T01:00:30Z' })).body
        .entries,
    ).toHaveLength(1);
  });

  it('keeps the log to Owners and to the Organisation, and record history to those who read the record', async () => {
    const reader = (
      await createAdmin(app(), { memberOf: [organisationId], permissions: { registrations: 'read' } })
    ).headers(organisationId);
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);
    await query(
      `INSERT INTO audit_entries (organisation_id, occurred_at, actor_kind, actor_identity, action, target_type, target_id)
       VALUES ($1, now(), 'admin', $2, 'health_answers.view', 'registration', $3)`,
      [organisationId, owner.id, registrationId],
    );
    const history = async (as: RequestHeaders) =>
      ((await http().get(`/api/registrations/${registrationId}/history`).set(as)).body as AuditEntry[]).map(
        ({ action }) => action,
      );

    expect((await log({}, reader)).status).toBe(403);
    expect(await history(reader)).not.toEqual([]);
    expect(await history(reader)).not.toContain('health_answers.view');
    expect(await history(headers)).toContain('health_answers.view');
    expect((await log({ targetId: registrationId }, otherOwner)).body.entries).toEqual([]);
  });
});
