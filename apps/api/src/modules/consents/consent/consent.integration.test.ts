import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
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

describe('Consent progress across a Camp', () => {
  const { app, http, database, expectIsolated } = useTestApp();

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  // A Camp with its Consents switched on, the Owner and the guardian every made-up Registration has.
  const campWithConsents = async (organisationId: string) => {
    const campId = await createCamp(app(), organisationId);
    const owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: true } });
    const guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;

    return { campId, owner, guardian };
  };
  const consent = async (owner: RequestHeaders, campId: string, title: string) =>
    (
      await http()
        .post(`/api/camps/${campId}/consents`)
        .set(owner)
        .send({ ...CONTENT, title, withdrawable: true })
    ).body.id as string;
  // A Participant's Registration to a Turnus, a new one unless named.
  const participant = async (organisationId: string, campId: string, turnusId?: string) => {
    const { id: registrationId } = await submitRegistration(app(), organisationId, campId, { turnusId });
    const [row] = await query<{ id: string; turnus_id: string }>(
      'SELECT p.id, r.turnus_id FROM participants p JOIN registrations r ON r.id = p.registration_id WHERE r.id = $1',
      [registrationId],
    );

    return { registrationId, participantId: row?.id ?? '', turnusId: row?.turnus_id ?? '' };
  };
  const portalPath = (registrationId: string, participantId: string, consentId: string) =>
    `/api/portal/registrations/${registrationId}/participants/${participantId}/consents/${consentId}`;
  const sign = async (
    guardian: RequestHeaders,
    { registrationId, participantId }: { registrationId: string; participantId: string },
    consentId: string,
  ) => {
    const path = portalPath(registrationId, participantId, consentId);
    const versionId = (await http().get(path).set(guardian)).body.version.id;
    const signed = await http()
      .post(`${path}/signatures`)
      .set(guardian)
      .send({
        consentVersionId: versionId,
        answers: { [RULES]: true, [PHOTOS]: true },
        signerName: 'Jana Testovací',
        signerPlace: 'Testov',
      });

    expect(signed.status).toBe(201);
  };
  const progressOf = async (campId: string, headers: RequestHeaders) =>
    Object.fromEntries(
      (
        (await http().get(`/api/camps/${campId}/consents`).set(headers)).body as { title: string; progress: unknown }[]
      ).map(({ title, progress }) => [title, progress]),
    );

  it('counts the Registered children of every Turnus whose signature is in force, not the Cancelled or Withdrawn', async () => {
    const organisationId = await createOrganisation(app());
    const { campId, owner, guardian } = await campWithConsents(organisationId);
    const photos = await consent(owner, campId, 'Fotografování');
    const trips = await consent(owner, campId, 'Výlety');
    const signedOnce = await participant(organisationId, campId);
    const { turnusId: first } = signedOnce;
    const withdrawn = await participant(organisationId, campId, first);
    const cancelled = await participant(organisationId, campId, first);
    const signedTwice = await participant(organisationId, campId);
    await participant(organisationId, campId, signedTwice.turnusId);

    await sign(guardian, signedOnce, photos);
    await sign(guardian, signedOnce, trips);
    await sign(guardian, withdrawn, photos);
    await http()
      .post(`${portalPath(withdrawn.registrationId, withdrawn.participantId, photos)}/withdrawal`)
      .set(guardian)
      .expect(201);
    await sign(guardian, cancelled, photos);
    await http()
      .post(`/api/registrations/${cancelled.registrationId}/participants/${cancelled.participantId}/cancel`)
      .set(owner)
      .expect(200);
    await sign(guardian, signedTwice, photos);
    await sign(guardian, signedTwice, photos);

    expect(await progressOf(campId, owner)).toEqual({
      Fotografování: { signed: 2, registered: 4 },
      Výlety: { signed: 1, registered: 4 },
    });
  });

  it("shows progress only with Registrations read, and never counts another Organisation's children", async () => {
    const organisationId = await createOrganisation(app());
    const { campId, owner, guardian } = await campWithConsents(organisationId);
    const photos = await consent(owner, campId, 'Fotografování');
    await sign(guardian, await participant(organisationId, campId), photos);
    const otherId = await createOrganisation(app());
    const other = await campWithConsents(otherId);
    const otherPhotos = await consent(other.owner, other.campId, 'Fotografování');
    await sign(other.guardian, await participant(otherId, other.campId), otherPhotos);
    await participant(otherId, other.campId);
    const settingsOnly = await createAdmin(app(), {
      memberOf: [organisationId],
      permissions: { campSettings: 'write' },
    });
    const registrationsToo = await createAdmin(app(), {
      memberOf: [organisationId],
      permissions: { campSettings: 'read', registrations: 'read' },
    });

    expect(await progressOf(campId, settingsOnly.headers(organisationId))).toEqual({ Fotografování: null });
    expect(await progressOf(campId, registrationsToo.headers(organisationId))).toEqual({
      Fotografování: { signed: 1, registered: 1 },
    });
    expect(await progressOf(other.campId, other.owner)).toEqual({ Fotografování: { signed: 1, registered: 2 } });
    await expectIsolated(() => http().get(`/api/camps/${campId}/consents`).set(other.owner));
  });
});
