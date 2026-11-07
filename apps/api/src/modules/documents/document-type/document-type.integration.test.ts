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
    expect(await documentsOf(firstRegistration)).toEqual({ downloads: [], requirements: [] });
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
