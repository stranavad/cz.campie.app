import { beforeEach, describe, expect, it } from 'vitest';

import type { Permissions } from '@repo/schema/admins';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { FileService } from '../../../core/files/file.service.ts';
import {
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { snapshot } from '../../../testing/tenant-isolation.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { CampService } from './services/camp.service.ts';

const NONE: Permissions = {
  registrations: 'none',
  campSettings: 'none',
  health: 'none',
  oddily: 'none',
  vedouci: 'none',
};

const NEW_CAMP = {
  name: 'Zimní tábor Pokusník',
  slug: 'Zimni-Pokusnik',
  websiteUrl: 'https://pokusnik.example.com/zima',
  contactName: 'Jana Testovací',
  contactEmail: 'Zima@Pokusnik.example.com',
  contactPhone: '+420 123 456 789',
};

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('camps', () => {
  const { app, http, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Admin;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), { accentColour: '#2b8a4e' });
    campId = await createCamp(app(), organisationId, 'Letní tábor Pokusník', 'letni-pokusnik');
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const create = (headers: RequestHeaders, body: object = NEW_CAMP) =>
    http().post('/api/camps').set(headers).send(body);
  const update = (headers: RequestHeaders, body: object, id = campId) =>
    http().patch(`/api/camps/${id}`).set(headers).send(body);
  const publicCamp = async (slug: string, id = organisationId) =>
    http()
      .get(`/api/public-camps/${slug}`)
      .set({ Host: await organisationHost(app(), id) });

  it('creates a Camp with its slug, website and contact, every module off, audited', async () => {
    const response = await create(owner.headers(organisationId));

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'Zimní tábor Pokusník',
      slug: 'zimni-pokusnik',
      websiteUrl: 'https://pokusnik.example.com/zima',
      contactName: 'Jana Testovací',
      contactEmail: 'zima@pokusnik.example.com',
      contactPhone: '+420 123 456 789',
      modules: {
        consents: false,
        documents: false,
        generatedDocuments: false,
        healthRecord: false,
        campHealthLog: false,
        oddily: false,
        vedouci: false,
      },
      siblingDiscountAmount: 0,
      siblingDiscountAppliesTo: 'every_child',
      notificationEmails: [],
      contactEditLockDate: null,
    });
    expect(
      await query('SELECT actor_identity, action, target_id FROM audit_entries WHERE target_id = $1', [
        response.body.id,
      ]),
    ).toEqual([{ actor_identity: owner.id, action: 'camp.create', target_id: response.body.id }]);
  });

  it("lists the Organisation's Camps by name to every member, whatever their areas", async () => {
    await create(owner.headers(organisationId));
    const member = await createAdmin(app(), { memberOf: [organisationId], permissions: NONE });

    const response = await http().get('/api/camps').set(member.headers(organisationId));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: campId, name: 'Letní tábor Pokusník', slug: 'letni-pokusnik' },
      { id: expect.any(String), name: 'Zimní tábor Pokusník', slug: 'zimni-pokusnik' },
    ]);
  });

  it('renames a Camp and changes its contact, audited with old and new values', async () => {
    const response = await update(owner.headers(organisationId), {
      name: 'Letní tábor Pokusník 2027',
      contactEmail: 'leto@pokusnik.example.com',
      websiteUrl: '',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'Letní tábor Pokusník 2027',
      contactEmail: 'leto@pokusnik.example.com',
      websiteUrl: null,
    });
    expect(
      await query('SELECT changes FROM audit_entries WHERE action = $1 AND target_id = $2', ['camp.update', campId]),
    ).toEqual([
      {
        changes: {
          name: { old: 'Letní tábor Pokusník', new: 'Letní tábor Pokusník 2027' },
          contactEmail: { old: null, new: 'leto@pokusnik.example.com' },
        },
      },
    ]);
  });

  it('sets the Sibling discount and whom it goes to, audited', async () => {
    const response = await update(owner.headers(organisationId), {
      siblingDiscountAmount: 500,
      siblingDiscountAppliesTo: 'from_second_child',
    });

    expect(response.body).toMatchObject({ siblingDiscountAmount: 500, siblingDiscountAppliesTo: 'from_second_child' });
    expect(
      await query('SELECT changes FROM audit_entries WHERE action = $1 AND target_id = $2', ['camp.update', campId]),
    ).toEqual([
      {
        changes: {
          siblingDiscountAmount: { old: 0, new: 500 },
          siblingDiscountAppliesTo: { old: 'every_child', new: 'from_second_child' },
        },
      },
    ]);
  });

  it.each([
    { siblingDiscountAmount: -100 },
    { siblingDiscountAppliesTo: 'kazde_druhe' },
    { slug: 'Letní tábor' },
    { slug: 'portal' },
    { websiteUrl: 'javascript:alert(1)' },
    { contactEmail: 'neni-email' },
    {},
  ])('rejects an invalid change (%o), changing nothing', async (body) => {
    const before = await snapshot(database().ownerUrl);

    expect((await update(owner.headers(organisationId), body)).status).toBe(400);
    expect(await snapshot(database().ownerUrl)).toEqual(before);
  });

  it('keeps slugs unique within the Organisation, but not across Organisations', async () => {
    const taken = await create(owner.headers(organisationId), { ...NEW_CAMP, slug: 'letni-pokusnik' });

    expect(taken.status).toBe(409);
    expect(taken.body).toMatchObject({ code: 'camp_slug_taken' });

    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    expect((await create(otherOwner.headers(otherId), { ...NEW_CAMP, slug: 'letni-pokusnik' })).status).toBe(201);
  });

  it('finds a Camp publicly by its slug or a former one, and gives the current one', async () => {
    await update(owner.headers(organisationId), { slug: 'leto-pokusnik' });
    expect(
      await query('SELECT changes FROM audit_entries WHERE action = $1 AND target_id = $2', ['camp.update', campId]),
    ).toEqual([{ changes: { slug: { old: 'letni-pokusnik', new: 'leto-pokusnik' } } }]);

    for (const slug of ['leto-pokusnik', 'letni-pokusnik', 'LETNI-POKUSNIK']) {
      const response = await publicCamp(slug);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: campId,
        name: 'Letní tábor Pokusník',
        slug: 'leto-pokusnik',
        websiteUrl: null,
        accentColour: '#2b8a4e',
        logoUrl: null,
      });
    }

    expect((await publicCamp('neexistuje')).status).toBe(404);
  });

  it('refuses another Camp a former slug, and lets a Camp return to its own', async () => {
    await update(owner.headers(organisationId), { slug: 'leto-pokusnik' });
    const other = await create(owner.headers(organisationId));

    const refused = await update(owner.headers(organisationId), { slug: 'letni-pokusnik' }, other.body.id);
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'camp_slug_taken' });
    expect((await create(owner.headers(organisationId), { ...NEW_CAMP, slug: 'letni-pokusnik' })).status).toBe(409);

    const back = await update(owner.headers(organisationId), { slug: 'letni-pokusnik' });
    expect(back.body).toMatchObject({ slug: 'letni-pokusnik' });
    expect((await publicCamp('leto-pokusnik')).body).toMatchObject({ id: campId, slug: 'letni-pokusnik' });
  });

  it('gives a slug claimed by two requests at once to exactly one Camp', async () => {
    const other = await create(owner.headers(organisationId));

    const responses = await Promise.all([
      create(owner.headers(organisationId), { ...NEW_CAMP, slug: 'sporna-adresa' }),
      update(owner.headers(organisationId), { slug: 'sporna-adresa' }),
      update(owner.headers(organisationId), { slug: 'sporna-adresa' }, other.body.id),
    ]);

    expect(responses.filter(({ status }) => status < 300)).toHaveLength(1);
    expect(responses.filter(({ status }) => status === 409)).toHaveLength(2);
    expect(await query("SELECT camp_id FROM camp_slugs WHERE slug = 'sporna-adresa'")).toHaveLength(1);
  });

  it("finds no Camp of another Organisation by slug on this one's subdomain", async () => {
    const otherId = await createOrganisation(app());
    await createCamp(app(), otherId, 'Cizí tábor', 'cizi-tabor');

    await expectIsolated(() => publicCamp('cizi-tabor'));
  });

  it('switches modules per Camp, and switching one off and on keeps every record', async () => {
    // Stands in for a module's data: a record of the Organisation the switches must not touch.
    await app()
      .get(UnitOfWork)
      .run(organisationId, () =>
        app()
          .get(FileService)
          .store({ name: 'souhlas.pdf', bytes: Buffer.from('%PDF-1.7 fake') }),
      );
    const others = async () => {
      const { 'public.camps': _camps, 'public.audit_entries': _audit, ...rest } = await snapshot(database().ownerUrl);

      return rest;
    };
    const before = await others();
    const allOff = (await http().get(`/api/camps/${campId}`).set(owner.headers(organisationId))).body.modules;

    const on = await update(owner.headers(organisationId), { modules: { ...allOff, consents: true, oddily: true } });
    expect(on.body.modules).toMatchObject({ consents: true, oddily: true, documents: false });

    const off = await update(owner.headers(organisationId), { modules: { ...allOff, oddily: true } });
    expect(off.body.modules).toMatchObject({ consents: false, oddily: true });
    expect(await others()).toEqual(before);

    const onAgain = await update(owner.headers(organisationId), { modules: { ...allOff, consents: true } });
    expect(onAgain.body.modules).toMatchObject({ consents: true, oddily: false });
    expect(await others()).toEqual(before);
    expect(
      await query('SELECT changes FROM audit_entries WHERE action = $1 AND target_id = $2 ORDER BY id', [
        'camp.update',
        campId,
      ]),
    ).toEqual([
      { changes: { modules: { old: [], new: ['consents', 'oddily'] } } },
      { changes: { modules: { old: ['consents', 'oddily'], new: ['oddily'] } } },
      { changes: { modules: { old: ['oddily'], new: ['consents'] } } },
    ]);
  });

  it('takes Camp settings read to see a Camp and write to create or change one', async () => {
    await expectPermission(['campSettings', 'read'], organisationId, (headers) =>
      http().get(`/api/camps/${campId}`).set(headers),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => update(headers, { name: 'Jiný' }));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      create(headers, { ...NEW_CAMP, slug: `novy-${Math.random().toString(36).slice(2, 8)}` }),
    );
  });

  it("keeps another Organisation's admins away from the Camp, even by its id", async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    await expectIsolated(() => http().get(`/api/camps/${campId}`).set(otherOwner.headers(otherId)));
    await expectIsolated(() => update(otherOwner.headers(otherId), { name: 'Převzato' }));
    expect((await http().get('/api/camps').set(otherOwner.headers(otherId))).body).toEqual([]);
  });

  it('gives the first Camp a slug from its name, or a fallback when the name makes none or a reserved one', async () => {
    const created = await app()
      .get(UnitOfWork)
      .run(organisationId, async () => [
        await app().get(CampService).createFirst({ kind: 'system' }, { name: 'Tábor Na Vršku' }),
        await app().get(CampService).createFirst({ kind: 'system' }, { name: 'Portal' }),
      ]);

    expect(created.map((camp) => camp.slug)).toEqual(['tabor-na-vrsku', 'tabor']);
    expect((await publicCamp('tabor-na-vrsku')).status).toBe(200);
  });
});
