import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { FileService } from '../../../core/files/file.service.ts';
import { createAdmin, createOrganisation, organisationHost, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

// The first bytes of a PNG and a JPG, which decide the type; the rest is made up.
const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('fake logo')]);
const PDF = Buffer.from('%PDF-1.7 fake');

describe('organisation settings', () => {
  const { app, http, database, files, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let owner: Awaited<ReturnType<typeof createAdmin>>;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), {
      legalName: 'Spolek Pokusník z. s.',
      ico: '12345679',
      displayName: 'Tábor Pokusník',
    });
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const update = (headers: RequestHeaders, body: object) =>
    http().patch('/api/organisation-settings').set(headers).send(body);

  const uploadLogo = (bytes: Buffer, name: string) =>
    http().put('/api/organisation-settings/logo').set(owner.headers(organisationId)).attach('file', bytes, name);

  const publicOrganisation = async () =>
    (
      await http()
        .get('/api/organisation')
        .set({ Host: await organisationHost(app(), organisationId) })
    ).body as {
      displayName: string;
      accentColour: string;
      logoUrl: string | null;
    };

  it('shows the Owner the legal identity, contacts, bank account and branding', async () => {
    const response = await http().get('/api/organisation-settings').set(owner.headers(organisationId));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      legalName: 'Spolek Pokusník z. s.',
      ico: '12345679',
      bankAccount: null,
      displayName: 'Tábor Pokusník',
      accentColour: '#2b8a4e',
      logo: null,
    });
  });

  it('changes the settings and audits old and new values', async () => {
    const response = await update(owner.headers(organisationId), {
      legalName: 'Spolek Pokusník Testov z. s.',
      bankAccount: '000035-1000000005/0300',
      accentColour: '#1D3557',
      statutoryRepresentative: 'Petr Zkušební',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      legalName: 'Spolek Pokusník Testov z. s.',
      bankAccount: '35-1000000005/0300',
      accentColour: '#1d3557',
      statutoryRepresentative: 'Petr Zkušební',
      ico: '12345679',
    });
    expect(await publicOrganisation()).toMatchObject({ accentColour: '#1d3557' });
    expect(
      await query('SELECT actor_identity, action, target_id, changes FROM audit_entries WHERE organisation_id = $1', [
        organisationId,
      ]),
    ).toEqual([
      {
        actor_identity: owner.id,
        action: 'organisation.update',
        target_id: organisationId,
        changes: {
          legalName: { old: 'Spolek Pokusník z. s.', new: 'Spolek Pokusník Testov z. s.' },
          bankAccount: { old: null, new: '35-1000000005/0300' },
          accentColour: { old: '#2b8a4e', new: '#1d3557' },
          statutoryRepresentative: { old: 'Jana Testovací', new: 'Petr Zkušební' },
        },
      },
    ]);
  });

  it('removes the bank account when it is emptied', async () => {
    await update(owner.headers(organisationId), { bankAccount: '1234567899/0100' });

    const response = await update(owner.headers(organisationId), { bankAccount: '' });

    expect(response.body).toMatchObject({ bankAccount: null });
  });

  // The form checks with the same schemas and shows their codes; the API only refuses.
  it.each([{}, { ico: '12345678' }, { bankAccount: '1234567890/0100' }, { accentColour: 'red; background: url(x)' }])(
    'rejects an empty change, or an invalid IČO, bank account or colour (%o), changing nothing',
    async (body) => {
      const response = await update(owner.headers(organisationId), body);

      expect(response.status).toBe(400);
      expect(await query('SELECT FROM audit_entries WHERE organisation_id = $1', [organisationId])).toEqual([]);
    },
  );

  it('lets only Owners read or change the settings', async () => {
    await expectPermission(['owner'], organisationId, (headers) =>
      http().get('/api/organisation-settings').set(headers),
    );
    await expectPermission(['owner'], organisationId, (headers) => update(headers, { displayName: 'Jiný název' }));
  });

  it("keeps another Organisation's Owner out", async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });

    await expectIsolated(() => update(otherOwner.headers(organisationId), { displayName: 'Převzato' }));
  });

  it('stores the logo encrypted and serves it on the public pages, and a new one under a new address', async () => {
    const uploaded = await uploadLogo(PNG, 'logo.png');

    expect(uploaded.status).toBe(200);
    expect(uploaded.body.logo).toMatchObject({ url: expect.stringMatching(/^\/api\/downloads\//) });
    expect([...files().objects.values()].some((object) => object.includes(PNG))).toBe(false);

    const { logoUrl } = await publicOrganisation();
    const served = await http()
      .get(logoUrl ?? '')
      .set({ Host: await organisationHost(app(), organisationId) })
      .buffer(true);

    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');
    expect(served.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(served.headers['content-security-policy']).toBe("default-src 'none'; sandbox");
    expect(served.body).toEqual(PNG);

    await uploadLogo(PNG, 'novy.png');

    expect((await publicOrganisation()).logoUrl).not.toBe(logoUrl);
    expect(
      (
        await http()
          .get(logoUrl ?? '')
          .set({ Host: await organisationHost(app(), organisationId) })
      ).status,
    ).toBe(404);
    expect(await query('SELECT id FROM files WHERE organisation_id = $1', [organisationId])).toHaveLength(1);
  });

  it('removes the logo and its file', async () => {
    await uploadLogo(PNG, 'logo.png');

    const response = await http().delete('/api/organisation-settings/logo').set(owner.headers(organisationId));

    expect(response.body).toMatchObject({ logo: null });
    expect((await publicOrganisation()).logoUrl).toBeNull();
    expect(await query('SELECT id FROM files')).toEqual([]);
  });

  it.each([
    [PDF, 'logo.pdf', 400, 'file_type_not_allowed'],
    [Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]), 'logo.png', 413, 'file_too_large'],
  ])('rejects a logo that is no small image (%#)', async (bytes, name, status, code) => {
    const response = await uploadLogo(bytes, name);

    expect(response.status).toBe(status);
    expect(response.body).toMatchObject({ code });
    expect(await query('SELECT id FROM files')).toEqual([]);
  });

  it("serves no file but a logo, and no other Organisation's logo", async () => {
    const host = { Host: await organisationHost(app(), organisationId) };
    // Another file of the same Organisation, such as a guardian's upload.
    const notALogo = await app()
      .get(UnitOfWork)
      .run(organisationId, () => app().get(FileService).store({ name: 'karta.pdf', bytes: PDF }));
    const otherId = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherId], owner: true });
    await http()
      .put('/api/organisation-settings/logo')
      .set(otherOwner.headers(otherId))
      .attach('file', PNG, 'logo.png');
    const [otherLogo] = await query<{ logo_file_id: string }>('SELECT logo_file_id FROM organisations WHERE id = $1', [
      otherId,
    ]);

    expect((await http().get(`/api/logos/${notALogo}`).set(host)).status).toBe(404);
    await expectIsolated(() => http().get(`/api/logos/${otherLogo?.logo_file_id}`).set(host));
  });
});
