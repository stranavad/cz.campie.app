import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAdmin, createCamp, createOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const PDF = Buffer.from('%PDF-1.7 táborový řád, zkušební obsah');
const RULES = '0190a2b4-0000-7000-8000-0000000000c1';
const PHOTOS = '0190a2b4-0000-7000-8000-0000000000c2';
const CONTENT = {
  title: 'Souhlas s táborovým řádem',
  introduction: 'Přečtěte si prosím táborový řád.',
  items: [
    { id: RULES, kind: 'must_agree', text: 'Souhlasím s táborovým řádem.' },
    { id: PHOTOS, kind: 'yes_no', text: 'Souhlasím s fotografováním dítěte.' },
  ],
  withdrawable: false,
  fileId: null,
};

describe('Consents', () => {
  const { app, http, database, files, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const create = (body: object = CONTENT, headers = owner) =>
    http().post(`/api/camps/${campId}/consents`).set(headers).send(body);
  const publish = (consentId: string, body: object) =>
    http().put(`/api/camps/${campId}/consents/${consentId}`).set(owner).send(body);
  const upload = () => http().post(`/api/camps/${campId}/consent-files`).set(owner).attach('file', PDF, 'rad.pdf');

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
  });

  it('publishes version 1 on create, and an edit as version 2 leaving version 1 as it was', async () => {
    const created = await create();
    const consentId = created.body.id as string;

    expect(created.status).toBe(201);
    const { fileId: _none, ...written } = CONTENT;
    expect(created.body.versions).toMatchObject([{ version: 1, ...written, file: null }]);

    const edited = await publish(consentId, { ...CONTENT, title: 'Táborový řád', withdrawable: true });
    const unchanged = await publish(consentId, { ...CONTENT, title: 'Táborový řád', withdrawable: true });

    expect(edited.body.versions).toMatchObject([
      { version: 2, title: 'Táborový řád', withdrawable: true },
      { version: 1, title: 'Souhlas s táborovým řádem', withdrawable: false },
    ]);
    expect(unchanged.body.versions).toHaveLength(2);
    expect((await http().get(`/api/camps/${campId}/consents`).set(owner)).body).toEqual([
      expect.objectContaining({ id: consentId, title: 'Táborový řád', version: 2 }),
    ]);
    expect(
      (
        await query<{ action: string }>(
          `SELECT action FROM audit_entries WHERE action LIKE 'consent.%' ORDER BY occurred_at, id`,
        )
      ).map(({ action }) => action),
    ).toEqual(['consent.create', 'consent.publish', 'consent.publish']);
  });

  it('stores an attached PDF encrypted with its fingerprint, and a new PDF makes a new version', async () => {
    const first = await upload();
    const second = await upload();

    expect(first.body.sha256).toBe(createHash('sha256').update(PDF).digest('hex'));
    expect([...files().objects.values()].some((object) => object.includes(PDF))).toBe(false);

    const created = await create({ ...CONTENT, fileId: first.body.fileId });
    const replaced = await publish(created.body.id, { ...CONTENT, fileId: second.body.fileId });

    expect(replaced.body.versions).toMatchObject([
      { version: 2, file: { id: second.body.fileId, sha256: first.body.sha256 } },
      { version: 1, file: { id: first.body.fileId, sha256: first.body.sha256 } },
    ]);
  });

  it('refuses a PDF not uploaded for the Camp, and an item without a kind it knows', async () => {
    const otherCampId = await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const elsewhere = await http()
      .post(`/api/camps/${otherCampId}/consent-files`)
      .set(owner)
      .attach('file', PDF, 'rad.pdf');

    expect((await create({ ...CONTENT, fileId: elsewhere.body.fileId })).body.code).toBe('consent_file_unknown');
    const otherId = await createOrganisation(app());
    const otherCamp = await createCamp(app(), otherId, 'Cizí tábor', 'cizi-tabor');
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);
    const foreign = await http()
      .post(`/api/camps/${otherCamp}/consent-files`)
      .set(otherOwner)
      .attach('file', PDF, 'rad.pdf');
    expect((await create({ ...CONTENT, fileId: foreign.body.fileId })).body.code).toBe('consent_file_unknown');
    expect((await create({ ...CONTENT, items: [{ id: RULES, kind: 'signature', text: 'Podpis' }] })).status).toBe(400);
  });

  it('keeps a published version unchangeable by the application role', async () => {
    await create();

    await expect(
      withClient(database().appUrl, (client) => client.query(`UPDATE consent_versions SET title = 'Změněno'`)),
    ).rejects.toThrow(/permission denied/);
  });

  it('takes Camp settings read to view and write to change, and keeps another Organisation away', async () => {
    const consentId = (await create()).body.id as string;
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['campSettings', 'read'], organisationId, (headers) =>
      http().get(`/api/camps/${campId}/consents/${consentId}`).set(headers),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => create(CONTENT, headers));
    await expectIsolated(() => http().get(`/api/camps/${campId}/consents/${consentId}`).set(otherOwner));
    await expectIsolated(() => create(CONTENT, otherOwner));
  });
});
