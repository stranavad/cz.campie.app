import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  signIn,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { snapshot } from '../../../testing/tenant-isolation.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const FIELD_ID = '0190a2b4-0000-7000-8000-000000000001';
const DECLARATION_ID = '0190a2b4-0000-7000-8000-0000000000d1';
const PDF = Buffer.from('%PDF-1.7 fake terms');
const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('fake')]);

const TSHIRT = {
  id: FIELD_ID,
  type: 'single_choice',
  label: 'Velikost trička',
  hint: null,
  required: true,
  scope: 'participant',
  options: [
    { id: 's', label: 'S', surcharge: null, needsVerification: false },
    { id: 'm', label: 'M', surcharge: null, needsVerification: false },
  ],
};

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('registration form', () => {
  const { app, http, clock, database, files, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: Admin;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), { status: 'approved' });
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  const form = (headers: RequestHeaders) => http().get(`/api/camps/${campId}/registration-form`).set(headers);
  const saveDraft = (headers: RequestHeaders, definition: object, maxParticipants = 3, declarations: object[] = []) =>
    http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(headers)
      .send({ definition, maxParticipants, declarations });
  const uploadPdf = (headers: RequestHeaders, bytes = PDF, name = 'podminky.pdf') =>
    http().post(`/api/camps/${campId}/registration-form/files`).set(headers).attach('file', bytes, name);
  const publish = (headers: RequestHeaders) =>
    http().post(`/api/camps/${campId}/registration-form/versions`).set(headers);
  const publicForm = async (id = organisationId) =>
    http()
      .get('/api/public-camps/letni-tabor/registration-form')
      .set({ Host: await organisationHost(app(), id) });

  it('gives a new Camp a preset draft that publishes unchanged as version 1, audited', async () => {
    const preset = (await form(owner.headers(organisationId))).body;

    expect(preset).toMatchObject({ campId, draft: { standard: [], custom: [] }, maxParticipants: 4, latest: null });
    expect(preset.declarations).toHaveLength(4);
    expect(preset.declarations.every(({ mandatory }: { mandatory: boolean }) => mandatory)).toBe(true);

    const published = await publish(owner.headers(organisationId));

    expect(published.status).toBe(201);
    expect(published.body).toEqual({
      version: 1,
      definition: { standard: [], custom: [] },
      maxParticipants: 4,
      declarations: preset.declarations,
      publishedAt: expect.any(String),
    });
    expect(
      await query('SELECT action, changes FROM audit_entries WHERE action = $1', ['registration_form_version.create']),
    ).toEqual([
      {
        action: 'registration_form_version.create',
        changes: {
          campId: { old: null, new: campId },
          version: { old: null, new: 1 },
          maxParticipants: { old: null, new: 4 },
        },
      },
    ]);
  });

  it('serves guardians the last published version until the next publish, and keeps every version as it was', async () => {
    await publish(owner.headers(organisationId));
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [TSHIRT] });

    expect((await publicForm()).body).toMatchObject({ version: 1, definition: { custom: [] }, maxParticipants: 4 });

    await publish(owner.headers(organisationId));

    expect((await publicForm()).body).toMatchObject({
      version: 2,
      definition: { custom: [TSHIRT] },
      maxParticipants: 3,
    });
    expect(
      (await http().get(`/api/camps/${campId}/registration-form/versions/1`).set(owner.headers(organisationId))).body,
    ).toMatchObject({ version: 1, definition: { standard: [], custom: [] }, maxParticipants: 4 });
    expect((await form(owner.headers(organisationId))).body.latest).toMatchObject({ version: 2 });
  });

  it('publishes before approval, for a preview, but shows guardians nothing until the Organisation is approved', async () => {
    const pendingId = await createOrganisation(app(), { status: 'pending' });
    const pendingCampId = await createCamp(app(), pendingId, 'Letní tábor', 'letni-tabor');
    const pendingOwner = await createAdmin(app(), { memberOf: [pendingId], owner: true });

    const published = await http()
      .post(`/api/camps/${pendingCampId}/registration-form/versions`)
      .set(pendingOwner.headers(pendingId));

    expect(published.status).toBe(201);
    expect((await publicForm(pendingId)).status).toBe(404);
  });

  it('freezes declarations and their PDFs into a version, which opens without a session', async () => {
    const { fileId } = (await uploadPdf(owner.headers(organisationId))).body;
    const declaration = { id: DECLARATION_ID, text: 'Souhlasím s podmínkami.', mandatory: true, url: null, fileId };
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 3, [declaration]);
    await publish(owner.headers(organisationId));
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 3, [
      {
        ...declaration,
        text: 'Jiné znění.',
        mandatory: false,
        fileId: null,
        url: 'https://tabor.example.com/podminky',
      },
    ]);

    const shown = (await publicForm()).body.declarations;

    expect(shown).toEqual([
      {
        id: DECLARATION_ID,
        text: 'Souhlasím s podmínkami.',
        mandatory: true,
        url: null,
        file: {
          id: fileId,
          link: { url: expect.stringMatching(/^\/api\/downloads\//), expiresAt: expect.any(String) },
        },
      },
    ]);
    const download = await http().get(shown[0].file.link.url).buffer(true);
    expect(download.headers['content-type']).toBe('application/pdf');
    expect(Buffer.from(download.body as Buffer)).toEqual(PDF);
    expect(await query('SELECT id FROM files')).toHaveLength(1);
  });

  it('stores a declaration PDF encrypted, and takes only a PDF', async () => {
    expect((await uploadPdf(owner.headers(organisationId), PNG, 'obrazek.png')).status).toBe(400);
    expect((await uploadPdf(owner.headers(organisationId))).status).toBe(201);
    expect([...files().objects.values()].some((object) => object.includes(PDF))).toBe(false);
  });

  it('removes, audited, a PDF the previous draft named and the new one does not', async () => {
    const { fileId } = (await uploadPdf(owner.headers(organisationId))).body;
    const declaration = { id: DECLARATION_ID, text: 'Souhlasím.', mandatory: true, url: null, fileId };
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 3, [declaration]);

    await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 3, [{ ...declaration, fileId: null }]);

    expect(await query('SELECT id FROM files WHERE id = $1', [fileId])).toEqual([]);
    expect(await query('SELECT action FROM audit_entries WHERE target_id = $1 ORDER BY id', [fileId])).toEqual([
      { action: 'registration_form_file.create' },
      { action: 'registration_form_file.remove' },
    ]);
  });

  it("keeps a fresh upload nobody named yet through another admin's save, and removes it a day later", async () => {
    const { fileId } = (await uploadPdf(owner.headers(organisationId))).body;

    await saveDraft(owner.headers(organisationId), { standard: [], custom: [] });
    expect(await query('SELECT id FROM files WHERE id = $1', [fileId])).toHaveLength(1);

    clock().advance(25 * 60 * 60 * 1000);
    await saveDraft(
      { ...owner.headers(organisationId), ...(await signIn(app(), owner.id)) },
      { standard: [], custom: [] },
    );
    expect(await query('SELECT id FROM files WHERE id = $1', [fileId])).toEqual([]);
  });

  it('keeps the declarations in the order saved', async () => {
    const declarations = ['A', 'B', 'C'].map((text, index) => ({
      id: `0190a2b4-0000-7000-8000-0000000000e${index}`,
      text,
      mandatory: index !== 1,
      url: null,
      fileId: null,
    }));
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 3, declarations.toReversed());

    const saved = (await form(owner.headers(organisationId))).body.declarations;

    expect(saved.map(({ text, mandatory }: { text: string; mandatory: boolean }) => [text, mandatory])).toEqual([
      ['C', true],
      ['B', false],
      ['A', true],
    ]);
  });

  it("refuses a declaration naming a file that was not uploaded for the Camp's form", async () => {
    const otherCampId = await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const { fileId } = (
      await http()
        .post(`/api/camps/${otherCampId}/registration-form/files`)
        .set(owner.headers(organisationId))
        .attach('file', PDF, 'jinde.pdf')
    ).body;
    const declaration = { id: DECLARATION_ID, text: 'Souhlasím.', mandatory: true, url: null, fileId };

    const refused = await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 3, [declaration]);

    expect(refused.status).toBe(400);
    expect(refused.body).toMatchObject({ code: 'declaration_file_unknown' });
  });

  it.each([
    [{ text: '' }],
    [{ url: 'javascript:alert(1)' }],
    [{ url: 'https://tabor.example.com', fileId: '0190a2b4-0000-7000-8000-0000000000f1' }],
  ])('refuses a declaration that does not hold together (%o)', async (change) => {
    const declaration = { id: DECLARATION_ID, text: 'Souhlasím.', mandatory: true, url: null, fileId: null, ...change };

    expect(
      (await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 3, [declaration])).status,
    ).toBe(400);
  });

  it('audits a saved draft with old and new values', async () => {
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [TSHIRT] }, 2, []);

    expect(
      await query('SELECT target_type, target_id, changes FROM audit_entries WHERE action = $1', [
        'registration_form.update',
      ]),
    ).toEqual([
      {
        target_type: 'registration_form',
        target_id: campId,
        changes: {
          draft: { old: { standard: [], custom: [] }, new: { standard: [], custom: [TSHIRT] } },
          maxParticipants: { old: 4, new: 2 },
          declarations: { old: expect.any(Array), new: [] },
        },
      },
    ]);
  });

  it("serves the form by a former or capitalised slug, and never another Organisation's", async () => {
    await publish(owner.headers(organisationId));
    await http().patch(`/api/camps/${campId}`).set(owner.headers(organisationId)).send({ slug: 'leto' });
    const host = { Host: await organisationHost(app(), organisationId) };

    expect((await http().get('/api/public-camps/LETNI-TABOR/registration-form').set(host)).status).toBe(200);
    expect((await http().get('/api/public-camps/leto/registration-form').set(host)).status).toBe(200);

    const otherId = await createOrganisation(app(), { status: 'approved' });
    await expectIsolated(async () =>
      http()
        .get('/api/public-camps/leto/registration-form')
        .set({ Host: await organisationHost(app(), otherId) }),
    );
  });

  it('shows guardians nothing before the first publish', async () => {
    expect((await publicForm()).status).toBe(404);
  });

  it.each([
    [{ standard: [], custom: [TSHIRT, TSHIRT] }],
    [{ standard: [], custom: [{ ...TSHIRT, options: [] }] }],
    [{ standard: [{ key: 'rodneCislo', state: 'required' }], custom: [] }],
    [{ standard: [], custom: [{ ...TSHIRT, type: 'barva' }] }],
  ])('refuses a draft that does not hold together (%#), changing nothing', async (definition) => {
    const before = await snapshot(database().ownerUrl);

    expect((await saveDraft(owner.headers(organisationId), definition)).status).toBe(400);
    expect(await snapshot(database().ownerUrl)).toEqual(before);
  });

  it('refuses a most-children count outside 1 to 10', async () => {
    expect((await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 0)).status).toBe(400);
    expect((await saveDraft(owner.headers(organisationId), { standard: [], custom: [] }, 11)).status).toBe(400);
  });

  it('refuses to publish a field kept under its id with another type', async () => {
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [TSHIRT] });
    await publish(owner.headers(organisationId));
    const { options: _, ...withoutOptions } = TSHIRT;
    await saveDraft(owner.headers(organisationId), {
      standard: [],
      custom: [{ ...withoutOptions, type: 'short_text' }],
    });

    const refused = await publish(owner.headers(organisationId));

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'form_field_changed' });
  });

  it('refuses a field removed and added back under its id with another scope', async () => {
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [TSHIRT] });
    await publish(owner.headers(organisationId));
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [] });
    await publish(owner.headers(organisationId));
    await saveDraft(owner.headers(organisationId), { standard: [], custom: [{ ...TSHIRT, scope: 'registration' }] });

    expect((await publish(owner.headers(organisationId))).body).toMatchObject({ code: 'form_field_changed' });
  });

  it('numbers simultaneous publishes one after another', async () => {
    const responses = await Promise.all([1, 2, 3].map(() => publish(owner.headers(organisationId))));

    expect(responses.map(({ body }) => body.version).toSorted((a: number, b: number) => a - b)).toEqual([1, 2, 3]);
  });

  it('never lets the API change or remove a published version', async () => {
    await publish(owner.headers(organisationId));

    await expect(
      withClient(database().appUrl, (client) =>
        client.query('UPDATE registration_form_versions SET max_participants = 9'),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      withClient(database().appUrl, (client) => client.query('DELETE FROM registration_form_versions')),
    ).rejects.toThrow(/permission denied/);
  });

  it('takes Camp settings read to see the form and write to change or publish it', async () => {
    await publish(owner.headers(organisationId));

    await expectPermission(['campSettings', 'read'], organisationId, (headers) => form(headers));
    await expectPermission(['campSettings', 'read'], organisationId, (headers) =>
      http().get(`/api/camps/${campId}/registration-form/versions/1`).set(headers),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      saveDraft(headers, { standard: [], custom: [TSHIRT] }),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => publish(headers));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => uploadPdf(headers));
  });

  it("keeps another Organisation's admins away from the form, even by the Camp's id", async () => {
    await publish(owner.headers(organisationId));
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectIsolated(() => form(asOther));
    await expectIsolated(() => saveDraft(asOther, { standard: [], custom: [] }));
    await expectIsolated(() => publish(asOther));
    await expectIsolated(() => http().get(`/api/camps/${campId}/registration-form/versions/1`).set(asOther));
    await expectIsolated(() =>
      http().post(`/api/camps/${campId}/registration-form/files`).set(asOther).attach('file', PDF, 'x.pdf'),
    );
  });
});
