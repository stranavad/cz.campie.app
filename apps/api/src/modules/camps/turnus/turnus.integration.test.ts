import { beforeEach, describe, expect, it } from 'vitest';

import { instantFromPragueLocal } from '@repo/schema/shared';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  signIn,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { snapshot } from '../../../testing/tenant-isolation.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Tábořiště Pokusov',
  capacity: 40,
  minAge: 7,
  maxAge: 15,
  // Opens on the day the clocks go forward.
  opensAt: '2027-03-28T10:00',
  closesAt: '2027-06-01T00:00',
  closedManually: false,
  websiteUrl: 'https://pokusnik.example.com/turnus-1',
  basePrice: 6500,
  earlyBirdPrice: 5900,
  earlyBirdLastDay: '2027-03-31',
  deposit: 2000,
  depositDueDays: 21,
  balanceDueDate: '2027-06-15',
};

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('turnusy', () => {
  const { app, http, clock, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Admin;

  beforeEach(async () => {
    clock().set(new Date('2027-01-15T12:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId);
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const create = (headers: RequestHeaders, body: object = TURNUS, id = campId) =>
    http().post(`/api/camps/${id}/turnusy`).set(headers).send(body);
  const update = (headers: RequestHeaders, turnusId: string, body: object) =>
    http().patch(`/api/turnusy/${turnusId}`).set(headers).send(body);
  // Moves the clock, past the admin session's end too, so signs the Owner in again.
  const availabilityAt = async (turnusId: string, instant: Date) => {
    clock().set(instant);
    const headers = { ...owner.headers(organisationId), ...(await signIn(app(), owner.id)) };

    return (await http().get(`/api/turnusy/${turnusId}`).set(headers)).body.availability;
  };

  it('creates a Turnus with its window in Prague time and its price list, audited', async () => {
    const response = await create(owner.headers(organisationId));

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ...TURNUS,
      id: expect.any(String),
      campId,
      availability: 'not_yet_open',
      registered: 0,
    });
    expect(await query('SELECT opens_at FROM turnusy')).toEqual([{ opens_at: new Date('2027-03-28T08:00:00Z') }]);
    expect(
      await query('SELECT actor_identity, action FROM audit_entries WHERE target_id = $1', [response.body.id]),
    ).toEqual([{ actor_identity: owner.id, action: 'turnus.create' }]);
  });

  it("lists a Camp's Turnusy by start date", async () => {
    await create(owner.headers(organisationId), {
      ...TURNUS,
      name: 'Turnus 2',
      startDate: '2027-07-18',
      endDate: '2027-07-31',
    });
    await create(owner.headers(organisationId));

    const response = await http().get(`/api/camps/${campId}/turnusy`).set(owner.headers(organisationId));

    expect(response.body.map(({ name }: { name: string }) => name)).toEqual(['Turnus 1', 'Turnus 2']);
  });

  it('stores a Deposit of 0 as no Deposit and reports it so', async () => {
    const response = await create(owner.headers(organisationId), { ...TURNUS, deposit: 0 });

    expect(response.body.deposit).toBeNull();
    expect(await query('SELECT deposit FROM turnusy')).toEqual([{ deposit: null }]);
  });

  it.each([
    { endDate: '2027-07-03' },
    { capacity: 0 },
    { minAge: 16 },
    { closesAt: '2027-03-28T09:00' },
    { earlyBirdLastDay: null },
    { basePrice: -1 },
    { deposit: 100.5 },
    { startDate: '2027-02-30' },
    { opensAt: '2027-13-45T25:99' },
    { depositDueDays: undefined },
  ])('rejects a Turnus that does not add up (%o), creating nothing', async (change) => {
    const before = await snapshot(database().ownerUrl);

    expect((await create(owner.headers(organisationId), { ...TURNUS, ...change })).status).toBe(400);
    expect(await snapshot(database().ownerUrl)).toEqual(before);
  });

  it('opens at the exact Prague time, inclusive, across the clock change, and closes at the closing time, exclusive', async () => {
    const { id } = (await create(owner.headers(organisationId))).body;

    expect(await availabilityAt(id, new Date(instantFromPragueLocal('2027-03-28T10:00').getTime() - 1000))).toBe(
      'not_yet_open',
    );
    expect(await availabilityAt(id, new Date('2027-03-28T08:00:00Z'))).toBe('open');
    expect(await availabilityAt(id, new Date('2027-05-31T21:59:59Z'))).toBe('open');
    expect(await availabilityAt(id, new Date('2027-05-31T22:00:00Z'))).toBe('closed_by_window');
  });

  it('closes a Turnus by hand whatever its window, and reopens it', async () => {
    const { id } = (await create(owner.headers(organisationId))).body;
    clock().set(new Date('2027-04-01T12:00:00Z'));
    const headers = { ...owner.headers(organisationId), ...(await signIn(app(), owner.id)) };

    const closed = await update(headers, id, { ...TURNUS, closedManually: true });
    expect(closed.body.availability).toBe('closed_manually');

    const reopened = await update(headers, id, TURNUS);
    expect(reopened.body.availability).toBe('open');
  });

  it('changes a Turnus, audited with old and new values', async () => {
    const { id } = (await create(owner.headers(organisationId))).body;

    const response = await update(owner.headers(organisationId), id, { ...TURNUS, basePrice: 6900, capacity: 45 });

    expect(response.body).toMatchObject({ basePrice: 6900, capacity: 45 });
    expect(await query('SELECT changes FROM audit_entries WHERE action = $1', ['turnus.update'])).toEqual([
      { changes: { basePrice: { old: 6500, new: 6900 }, capacity: { old: 40, new: 45 } } },
    ]);
  });

  it('removes a Turnus, audited', async () => {
    const { id } = (await create(owner.headers(organisationId))).body;

    expect((await http().delete(`/api/turnusy/${id}`).set(owner.headers(organisationId))).status).toBe(204);
    expect(await query('SELECT id FROM turnusy')).toEqual([]);
    expect(await query('SELECT action FROM audit_entries WHERE target_id = $1 ORDER BY id', [id])).toEqual([
      { action: 'turnus.create' },
      { action: 'turnus.remove' },
    ]);
  });

  it('keeps a Turnus that has Registrations', async () => {
    const { id } = await submitRegistration(app(), organisationId, campId);
    const [registration] = await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [
      id,
    ]);

    const refused = await http().delete(`/api/turnusy/${registration?.turnus_id}`).set(owner.headers(organisationId));

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'turnus_has_registrations' });
  });

  it('takes Camp settings read to see Turnusy and write to change them', async () => {
    const { id } = (await create(owner.headers(organisationId))).body;

    await expectPermission(['campSettings', 'read'], organisationId, (headers) =>
      http().get(`/api/camps/${campId}/turnusy`).set(headers),
    );
    await expectPermission(['campSettings', 'read'], organisationId, (headers) =>
      http().get(`/api/turnusy/${id}`).set(headers),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => create(headers));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      update(headers, id, { ...TURNUS, name: 'Jiný' }),
    );
    // The first admitted member removes it; the later ones are admitted to a 404.
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      http().delete(`/api/turnusy/${id}`).set(headers),
    );
  });

  it("keeps another Organisation's admins away from its Turnusy and Camps, even by id", async () => {
    const { id } = (await create(owner.headers(organisationId))).body;
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });
    const asOther = otherOwner.headers(otherId);

    await expectIsolated(() => http().get(`/api/turnusy/${id}`).set(asOther));
    await expectIsolated(() => update(asOther, id, { ...TURNUS, name: 'Převzato' }));
    await expectIsolated(() => http().delete(`/api/turnusy/${id}`).set(asOther));
    await expectIsolated(() => http().get(`/api/camps/${campId}/turnusy`).set(asOther));
    await expectIsolated(() => create(asOther));
  });
});
