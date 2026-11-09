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

const PDF = Buffer.from('%PDF-1.7 zkušební seznam věcí');

describe('Document types', () => {
  const { app, http, database, files, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let guardian: RequestHeaders;
  let firstRegistration: string;
  let secondRegistration: string;
  let firstTurnus: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const create = (body: object, headers = owner) =>
    http().post(`/api/camps/${campId}/document-types`).set(headers).send(body);
  const attach = (typeId: string) =>
    http().put(`/api/camps/${campId}/document-types/${typeId}/file`).set(owner).attach('file', PDF, 'seznam.pdf');
  const documentsOf = async (registrationId: string) =>
    (await http().get(`/api/portal/registrations/${registrationId}/documents`).set(guardian)).body;
  const switchDocuments = async (on: boolean) => {
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, documents: on } });
  };
  const turnusOf = async (registrationId: string) =>
    (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [registrationId]))[0]
      ?.turnus_id ?? '';

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    await switchDocuments(true);
    firstRegistration = (await submitRegistration(app(), organisationId, campId)).id;
    secondRegistration = (await submitRegistration(app(), organisationId, campId)).id;
    firstTurnus = await turnusOf(firstRegistration);
    guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
  });

  it('shows a download limited to one Turnus only to its Registrations, through a short-lived link', async () => {
    const created = await create({
      kind: 'download',
      name: 'Seznam věcí',
      description: '',
      dueDate: null,
      turnusIds: [firstTurnus],
    });
    const attached = await attach(created.body.id);

    expect(attached.body.file).toMatchObject({ link: { url: expect.stringContaining('/api/downloads/') } });
    expect([...files().objects.values()].some((object) => object.includes(PDF))).toBe(false);
    expect((await documentsOf(firstRegistration)).downloads).toEqual([
      {
        id: created.body.id,
        name: 'Seznam věcí',
        description: '',
        file: expect.objectContaining({ url: expect.any(String) }),
      },
    ]);
    expect((await documentsOf(secondRegistration)).downloads).toEqual([]);
  });

  it('gives a requirement with its blank form and due date to every Turnus, and hides all with the module off', async () => {
    const created = await create({
      kind: 'requirement',
      name: 'Potvrzení o bezinfekčnosti',
      description: 'Vyplňte den před odjezdem.',
      dueDate: '2027-06-30',
      turnusIds: [],
    });
    await attach(created.body.id);

    for (const registrationId of [firstRegistration, secondRegistration]) {
      expect((await documentsOf(registrationId)).requirements).toEqual([
        expect.objectContaining({
          name: 'Potvrzení o bezinfekčnosti',
          dueDate: '2027-06-30',
          blankForm: expect.any(Object),
        }),
      ]);
    }

    await switchDocuments(false);
    expect(await documentsOf(firstRegistration)).toEqual({ downloads: [], requirements: [], participants: [] });
    expect((await http().get(`/api/camps/${campId}/document-types`).set(owner)).body).toHaveLength(1);
  });

  it('refuses a due date on a download and a Turnus of another Camp, and audits every change', async () => {
    const otherCamp = await createCamp(app(), organisationId, 'Zimní tábor', 'zimni-tabor');
    const elsewhere = await submitRegistration(app(), organisationId, otherCamp);

    expect(
      (await create({ kind: 'download', name: 'Seznam', description: '', dueDate: '2027-06-30', turnusIds: [] }))
        .status,
    ).toBe(400);
    expect(
      (
        await create({
          kind: 'download',
          name: 'Seznam',
          description: '',
          dueDate: null,
          turnusIds: [await turnusOf(elsewhere.id)],
        })
      ).body.code,
    ).toBe('document_type_turnus_unknown');

    const created = await create({ kind: 'download', name: 'Seznam', description: '', dueDate: null, turnusIds: [] });
    await attach(created.body.id);
    await http().delete(`/api/camps/${campId}/document-types/${created.body.id}`).set(owner);

    expect(
      (
        await query<{ action: string }>(
          `SELECT action FROM audit_entries WHERE action LIKE 'document_type.%' ORDER BY occurred_at, id`,
        )
      ).map(({ action }) => action),
    ).toEqual(['document_type.create', 'document_type.update', 'document_type.remove']);
    expect(await query('SELECT FROM files')).toHaveLength(0);
  });

  it('takes Camp settings write to change, and keeps another Organisation away', async () => {
    const body = { kind: 'download', name: 'Seznam', description: '', dueDate: null, turnusIds: [] };
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['campSettings', 'write'], organisationId, (headers) => create(body, headers));
    await expectIsolated(() => create(body, otherOwner));
  });
});

describe('Requirement progress across a Camp', () => {
  const { app, http, database, expectIsolated } = useTestApp();

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);

  // A Camp with its documents switched on, the Owner and the guardian every made-up Registration has.
  const campWithDocuments = async (organisationId: string) => {
    const campId = await createCamp(app(), organisationId);
    const owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, documents: true } });
    const guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;

    return { campId, owner, guardian };
  };
  const documentType = async (owner: RequestHeaders, campId: string, kind: string, name: string) =>
    (
      await http()
        .post(`/api/camps/${campId}/document-types`)
        .set(owner)
        .send({ kind, name, description: '', dueDate: null, turnusIds: [] })
    ).body.id as string;
  // A Participant's Registration to a Turnus, a new one unless named.
  const participant = async (organisationId: string, campId: string, turnusId?: string) => {
    const { id: registrationId } = await submitRegistration(app(), organisationId, campId, { turnusId });
    const [row] = await query<{ id: string; turnus_id: string }>(
      'SELECT p.id, r.turnus_id FROM participants p JOIN registrations r ON r.id = p.registration_id WHERE r.id = $1',
      [registrationId],
    );
    const path = `/registrations/${registrationId}/participants/${row?.id}/documents`;

    return { registrationId, participantId: row?.id ?? '', turnusId: row?.turnus_id ?? '', path };
  };
  const handIn = async (headers: RequestHeaders, path: string) =>
    http().post(path).set(headers).attach('file', PDF, 'potvrzeni.pdf').expect(201);
  const progressOf = async (campId: string, headers: RequestHeaders) =>
    Object.fromEntries(
      (
        (await http().get(`/api/camps/${campId}/document-types`).set(headers)).body as {
          name: string;
          progress: unknown;
        }[]
      ).map(({ name, progress }) => [name, progress]),
    );

  it('counts each requirement approved, to review and missing over the Registered children of every Turnus', async () => {
    const organisationId = await createOrganisation(app());
    const { campId, owner, guardian } = await campWithDocuments(organisationId);
    const doctor = await documentType(owner, campId, 'requirement', 'Potvrzení od lékaře');
    await documentType(owner, campId, 'requirement', 'Plavecký průkaz');
    await documentType(owner, campId, 'download', 'Seznam věcí');
    const approved = await participant(organisationId, campId);
    const { turnusId: first } = approved;
    const onPaper = await participant(organisationId, campId, first);
    const pending = await participant(organisationId, campId, first);
    const returned = await participant(organisationId, campId, first);
    await participant(organisationId, campId, first);
    const cancelled = await participant(organisationId, campId, first);
    const pendingElsewhere = await participant(organisationId, campId);
    const otherId = await createOrganisation(app());
    const other = await campWithDocuments(otherId);
    const otherDoctor = await documentType(other.owner, other.campId, 'requirement', 'Potvrzení od lékaře');

    await handIn(owner, `/api${approved.path}/${doctor}`);
    await http().post(`/api${onPaper.path}/${doctor}/paper`).set(owner).expect(201);
    await handIn(guardian, `/api/portal${pending.path}/${doctor}`);
    await handIn(guardian, `/api/portal${returned.path}/${doctor}`);
    const [toReturn] = await query<{ id: string }>('SELECT id FROM document_uploads WHERE participant_id = $1', [
      returned.participantId,
    ]);
    await http()
      .post(`/api/document-uploads/${toReturn?.id}/return`)
      .set(owner)
      .send({ note: 'Nečitelné.' })
      .expect(201);
    await handIn(owner, `/api${cancelled.path}/${doctor}`);
    await http()
      .post(`/api/registrations/${cancelled.registrationId}/participants/${cancelled.participantId}/cancel`)
      .set(owner)
      .expect(200);
    await handIn(guardian, `/api/portal${pendingElsewhere.path}/${doctor}`);
    await handIn(other.owner, `/api${(await participant(otherId, other.campId)).path}/${otherDoctor}`);

    expect(await progressOf(campId, owner)).toEqual({
      'Potvrzení od lékaře': { approved: 2, toReview: 2, missing: 2 },
      'Plavecký průkaz': { approved: 0, toReview: 0, missing: 6 },
      'Seznam věcí': null,
    });
    expect(await progressOf(other.campId, other.owner)).toEqual({
      'Potvrzení od lékaře': { approved: 1, toReview: 0, missing: 0 },
    });
  });

  it('shows progress only with Registrations read, and keeps another Organisation away', async () => {
    const organisationId = await createOrganisation(app());
    const { campId, owner } = await campWithDocuments(organisationId);
    const doctor = await documentType(owner, campId, 'requirement', 'Potvrzení od lékaře');
    await handIn(owner, `/api${(await participant(organisationId, campId)).path}/${doctor}`);
    const settingsOnly = await createAdmin(app(), {
      memberOf: [organisationId],
      permissions: { campSettings: 'write' },
    });
    const registrationsToo = await createAdmin(app(), {
      memberOf: [organisationId],
      permissions: { campSettings: 'read', registrations: 'read' },
    });
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    expect(await progressOf(campId, settingsOnly.headers(organisationId))).toEqual({ 'Potvrzení od lékaře': null });
    expect(await progressOf(campId, registrationsToo.headers(organisationId))).toEqual({
      'Potvrzení od lékaře': { approved: 1, toReview: 0, missing: 0 },
    });
    await expectIsolated(() => http().get(`/api/camps/${campId}/document-types`).set(otherOwner));
  });
});
