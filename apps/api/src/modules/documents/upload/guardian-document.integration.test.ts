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

const PDF = Buffer.from('%PDF-1.7 zkušební potvrzení od lékaře');
const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('zkušební sken')]);

describe('handing in documents', () => {
  const { app, http, database, files, jobs, expectIsolated } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let guardian: RequestHeaders;
  let registrationId: string;
  let participantId: string;
  let requirementId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const upload = (bytes: Buffer, name: string, headers = guardian) =>
    http()
      .post(`/api/portal/registrations/${registrationId}/participants/${participantId}/documents/${requirementId}`)
      .set(headers)
      .attach('file', bytes, name);
  const replace = (uploadId: string, bytes: Buffer, name: string, headers = guardian) =>
    http()
      .put(`/api/portal/registrations/${registrationId}/uploads/${uploadId}`)
      .set(headers)
      .attach('file', bytes, name);
  const handedIn = () =>
    query<{ id: string; file_id: string; status: string }>('SELECT id, file_id, status FROM document_uploads');
  const uploadsNow = async () =>
    (await http().get(`/api/portal/registrations/${registrationId}/documents`).set(guardian)).body.participants[0]
      .uploads[requirementId] as { status: string; file: { url: string } | null }[];

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, documents: true } });
    requirementId = (
      await http()
        .post(`/api/camps/${campId}/document-types`)
        .set(owner)
        .send({ kind: 'requirement', name: 'Potvrzení od lékaře', description: '', dueDate: null, turnusIds: [] })
    ).body.id;
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
    participantId =
      (await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [registrationId]))[0]
        ?.id ?? '';
    guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
  });

  it('hands in a PDF as Pending, stored as ciphertext, audited, to open again', async () => {
    const response = await upload(PDF, 'potvrzeni.pdf');

    expect(response.status).toBe(201);
    const [pending] = await uploadsNow();
    expect(pending).toMatchObject({ status: 'pending', file: { url: expect.any(String) } });
    expect((await http().get(pending?.file?.url ?? '')).status).toBe(200);
    expect([...files().objects.values()].some((object) => object.includes(PDF))).toBe(false);
    expect(await query(`SELECT actor_kind FROM audit_entries WHERE action = 'document_upload.create'`)).toEqual([
      { actor_kind: 'guardian' },
    ]);
  });

  it('refuses another type of file, and a second one while the first waits', async () => {
    expect((await upload(Buffer.from('ahoj'), 'poznamka.txt')).body.code).toBe('file_type_not_allowed');
    expect((await upload(PNG, 'sken.png')).status).toBe(201);
    expect((await upload(PDF, 'potvrzeni.pdf')).body.code).toBe('document_upload_not_needed');
  });

  it('takes one again after it was returned, keeping the returned one in history', async () => {
    await upload(PDF, 'potvrzeni.pdf');
    await query(`UPDATE document_uploads SET status = 'returned', note = 'Chybí razítko.'`);

    expect((await upload(PDF, 'potvrzeni-2.pdf')).status).toBe(201);
    expect((await uploadsNow()).map(({ status }) => status)).toEqual(['pending', 'returned']);
  });

  it('keeps a guardian of another family or Organisation away, and a removed requirement in use stays', async () => {
    const stranger = (await createGuardianSession(app(), organisationId, 'cizi.rodic@example.com')).headers;
    const otherId = await createOrganisation(app());
    const other = (await createGuardianSession(app(), otherId, 'jana.testovaci@example.com')).headers;
    await upload(PDF, 'potvrzeni.pdf');

    expect((await upload(PDF, 'potvrzeni.pdf', stranger)).status).toBe(404);
    await expectIsolated(() => upload(PDF, 'potvrzeni.pdf', other));
    expect((await http().delete(`/api/camps/${campId}/document-types/${requirementId}`).set(owner)).body.code).toBe(
      'document_type_in_use',
    );
  });

  it('replaces a document waiting for review, deleting the old file, audited', async () => {
    await upload(PDF, 'spatna-fotka.pdf');
    const [first] = await handedIn();
    await jobs().drain();
    expect([...files().objects.keys()].some((key) => key.endsWith(first?.file_id ?? '-'))).toBe(true);

    const response = await replace(first?.id ?? '', PNG, 'sken.png');

    expect(response.status).toBe(200);
    const [replaced] = await handedIn();
    expect(replaced).toMatchObject({ id: first?.id, status: 'pending' });
    expect(replaced?.file_id).not.toBe(first?.file_id);
    expect(await query('SELECT id FROM files WHERE id = $1', [first?.file_id])).toEqual([]);
    await jobs().drain();
    expect([...files().objects.keys()].some((key) => key.endsWith(first?.file_id ?? '-'))).toBe(false);
    const [shown] = await uploadsNow();
    expect((await http().get(shown?.file?.url ?? '')).body).toEqual(PNG);
    expect(
      await query(
        `SELECT actor_kind, actor_identity, target_id, changes ? 'fileId' AS file_changed FROM audit_entries
          WHERE action = 'document_upload.replace'`,
      ),
    ).toEqual([
      {
        actor_kind: 'guardian',
        actor_identity: 'jana.testovaci@example.com',
        target_id: participantId,
        file_changed: true,
      },
    ]);
  });

  it('replaces only while the document waits for review', async () => {
    await upload(PDF, 'potvrzeni.pdf');
    const [first] = await handedIn();
    await query(`UPDATE document_uploads SET status = 'approved'`);

    expect((await replace(first?.id ?? '', PNG, 'sken.png')).body.code).toBe('document_upload_not_pending');
    await query(`UPDATE document_uploads SET status = 'returned', note = 'Nečitelné.'`);
    expect((await replace(first?.id ?? '', PNG, 'sken.png')).body.code).toBe('document_upload_not_pending');
    expect((await handedIn())[0]?.file_id).toBe(first?.file_id);
    await query(`UPDATE document_uploads SET status = 'pending', note = NULL`);
    expect((await replace(first?.id ?? '', Buffer.from('ahoj'), 'poznamka.txt')).body.code).toBe(
      'file_type_not_allowed',
    );
  });

  it("keeps another family's and another Organisation's guardians from replacing a document", async () => {
    const stranger = (await createGuardianSession(app(), organisationId, 'cizi.rodic@example.com')).headers;
    const otherId = await createOrganisation(app());
    const other = (await createGuardianSession(app(), otherId, 'jana.testovaci@example.com')).headers;
    await upload(PDF, 'potvrzeni.pdf');
    const [first] = await handedIn();

    expect((await replace(first?.id ?? '', PNG, 'sken.png', stranger)).status).toBe(404);
    await expectIsolated(() => replace(first?.id ?? '', PNG, 'sken.png', other));
    expect((await handedIn())[0]?.file_id).toBe(first?.file_id);
  });
});
