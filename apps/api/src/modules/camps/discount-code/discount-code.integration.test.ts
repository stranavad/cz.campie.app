import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
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
import { DiscountCodeService } from './services/discount-code.service.ts';

const CODE = { code: 'Leto-2027', kind: 'percentage', value: 10, usageLimit: 2, expiresOn: '2027-03-31' };

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('discount codes', () => {
  const { app, http, clock, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Admin;

  beforeEach(async () => {
    clock().set(new Date('2027-03-01T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId);
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const create = (headers: RequestHeaders, body: object = CODE, id = campId) =>
    http().post(`/api/camps/${id}/discount-codes`).set(headers).send(body);
  const list = (headers: RequestHeaders, id = campId) => http().get(`/api/camps/${id}/discount-codes`).set(headers);

  // Uses a code by a guardian's submission.
  const recordUse = (code: string) => submitRegistration(app(), organisationId, campId, { discountCode: code });

  it('creates a Discount code, switched on and unused, audited', async () => {
    const response = await create(owner.headers(organisationId));

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ...CODE, id: expect.any(String), campId, active: true, uses: 0, status: 'valid' });
    expect(await query('SELECT action FROM audit_entries WHERE target_id = $1', [response.body.id])).toEqual([
      { action: 'discount_code.create' },
    ]);
  });

  it('keeps codes unique per Camp in any case, but not across Camps or Organisations', async () => {
    await create(owner.headers(organisationId));

    const taken = await create(owner.headers(organisationId), { ...CODE, code: 'LETO-2027' });
    expect(taken.status).toBe(409);
    expect(taken.body).toMatchObject({ code: 'discount_code_taken' });

    const otherCampId = await createCamp(app(), organisationId, 'Zimní tábor');
    expect((await create(owner.headers(organisationId), CODE, otherCampId)).status).toBe(201);

    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });
    expect((await create(otherOwner.headers(otherId), CODE, await createCamp(app(), otherId))).status).toBe(201);
  });

  it.each([
    { kind: 'percentage', value: 0 },
    { kind: 'percentage', value: 101 },
    { kind: 'fixed', value: 0 },
    { kind: 'fixed', value: 250.5 },
    { code: 'ab' },
    { code: 'LETO 2027' },
    { code: 'LÉTO' },
    { code: 'LЕTO' },
    { usageLimit: 0 },
    { expiresOn: '2027-02-30' },
  ])('rejects %o, creating nothing', async (change) => {
    const before = await snapshot(database().ownerUrl);

    expect((await create(owner.headers(organisationId), { ...CODE, ...change })).status).toBe(400);
    expect(await snapshot(database().ownerUrl)).toEqual(before);
  });

  it('counts recorded uses and reports the code exhausted at its limit', async () => {
    await create(owner.headers(organisationId));

    await recordUse(CODE.code);
    expect((await list(owner.headers(organisationId))).body).toMatchObject([{ uses: 1, status: 'valid' }]);

    await recordUse(CODE.code);
    expect((await list(owner.headers(organisationId))).body).toMatchObject([{ uses: 2, status: 'exhausted' }]);
  });

  it('is valid through its expiry day in Prague and expired after', async () => {
    await create(owner.headers(organisationId));
    const at = async (instant: string) => {
      clock().set(new Date(instant));

      return (await list({ ...owner.headers(organisationId), ...(await signIn(app(), owner.id)) })).body[0].status;
    };

    expect(await at('2027-03-31T21:59:59Z')).toBe('valid');
    expect(await at('2027-03-31T22:00:00Z')).toBe('expired');
  });

  it('switches a code off and changes its limit, audited with old and new values', async () => {
    const { id } = (await create(owner.headers(organisationId))).body;

    const response = await http()
      .patch(`/api/discount-codes/${id}`)
      .set(owner.headers(organisationId))
      .send({ active: false, usageLimit: 5 });

    expect(response.body).toMatchObject({ active: false, usageLimit: 5, status: 'inactive' });
    expect(await query('SELECT changes FROM audit_entries WHERE action = $1', ['discount_code.update'])).toEqual([
      { changes: { active: { old: true, new: false }, usageLimit: { old: 2, new: 5 } } },
    ]);
  });

  it('removes a code nobody used, audited, and keeps a used one', async () => {
    const unused = (await create(owner.headers(organisationId))).body;
    const used = (await create(owner.headers(organisationId), { ...CODE, code: 'POUZITY' })).body;
    await recordUse('POUZITY');

    expect((await http().delete(`/api/discount-codes/${unused.id}`).set(owner.headers(organisationId))).status).toBe(
      204,
    );
    const refused = await http().delete(`/api/discount-codes/${used.id}`).set(owner.headers(organisationId));

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'discount_code_used' });
    expect((await list(owner.headers(organisationId))).body).toMatchObject([{ code: 'POUZITY' }]);
    expect(await query('SELECT action FROM audit_entries WHERE target_id = $1 ORDER BY id', [unused.id])).toEqual([
      { action: 'discount_code.create' },
      { action: 'discount_code.remove' },
    ]);
  });

  it("checks a typed code in any case against the Camp's own codes only", async () => {
    const { id } = (await create(owner.headers(organisationId))).body;
    const otherCampId = await createCamp(app(), organisationId, 'Zimní tábor');
    const check = (camp: string, text: string) =>
      app()
        .get(UnitOfWork)
        .run(organisationId, () => app().get(DiscountCodeService).check(camp, text));

    expect(await check(campId, ' leto-2027 ')).toMatchObject({ code: { id }, status: 'valid' });
    expect(await check(otherCampId, 'LETO-2027')).toEqual({ code: null, status: 'unknown' });
    expect((await check(campId, 'ZIMA')).status).toBe('unknown');

    await recordUse('leto-2027');
    await recordUse('leto-2027');
    expect((await check(campId, 'LETO-2027')).status).toBe('exhausted');
  });

  it('takes Camp settings read to see codes and write to change them', async () => {
    const { id } = (await create(owner.headers(organisationId))).body;

    await expectPermission(['campSettings', 'read'], organisationId, (headers) => list(headers));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      create(headers, { ...CODE, code: `KOD-${Math.random().toString(36).slice(2, 8)}` }),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      http().patch(`/api/discount-codes/${id}`).set(headers).send({ active: false }),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      http().delete(`/api/discount-codes/${id}`).set(headers),
    );
  });

  it("keeps another Organisation's admins away from the codes, even by id", async () => {
    const { id } = (await create(owner.headers(organisationId))).body;
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });
    const asOther = otherOwner.headers(otherId);

    await expectIsolated(() => list(asOther));
    await expectIsolated(() => create(asOther));
    await expectIsolated(() => http().patch(`/api/discount-codes/${id}`).set(asOther).send({ active: false }));
    await expectIsolated(() => http().delete(`/api/discount-codes/${id}`).set(asOther));
  });
});
