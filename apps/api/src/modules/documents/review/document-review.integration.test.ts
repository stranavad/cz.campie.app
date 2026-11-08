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

const PDF = Buffer.from('%PDF-1.7 zkušební potvrzení');
const INTERNAL = Buffer.from('%PDF-1.7 interní zápis vedoucího');

describe('reviewing documents', () => {
  const { app, http, database, jobs, mail, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let guardian: RequestHeaders;
  let registrationId: string;
  let participantId: string;
  let requirementId: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const handIn = async () => {
    await http()
      .post(`/api/portal/registrations/${registrationId}/participants/${participantId}/documents/${requirementId}`)
      .set(guardian)
      .attach('file', PDF, 'potvrzeni.pdf');
    const [row] = await query<{ id: string }>('SELECT id FROM document_uploads ORDER BY uploaded_at DESC, id DESC');

    return row?.id ?? '';
  };
  const childPath = () => `/api/registrations/${registrationId}/participants/${participantId}`;
  const statuses = async () =>
    (
      (await http().get(`/api/registrations/${registrationId}/documents`).set(owner)).body.participants[0].uploads[
        requirementId
      ] as { status: string; byAdmin: boolean; file: object | null }[]
    ).map(({ status, byAdmin, file }) => ({ status, byAdmin, file: file !== null }));

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, documents: true, consents: true } });
    requirementId = (
      await http()
        .post(`/api/camps/${campId}/document-types`)
        .set(owner)
        .send({ kind: 'requirement', name: 'Potvrzení od lékaře', description: '', dueDate: null, turnusIds: [] })
    ).body.id;
    registrationId = (await submitRegistration(app(), organisationId, campId, { secondGuardian: true })).id;
    participantId =
      (await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [registrationId]))[0]
        ?.id ?? '';
    guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('approves a pending document, audited', async () => {
    const uploadId = await handIn();

    expect((await http().post(`/api/document-uploads/${uploadId}/approve`).set(owner)).body.status).toBe('approved');
    expect((await http().post(`/api/document-uploads/${uploadId}/approve`).set(owner)).body.code).toBe(
      'document_review_stale',
    );
    expect(await query(`SELECT FROM audit_entries WHERE action = 'document_upload.approve'`)).toHaveLength(1);
  });

  it('returns a document with a note emailed to both guardians, unless the Camp switched it off', async () => {
    const uploadId = await handIn();

    const returned = await http()
      .post(`/api/document-uploads/${uploadId}/return`)
      .set(owner)
      .send({ note: 'Chybí razítko lékaře.' });
    await jobs().drain();

    expect(returned.body).toMatchObject({ status: 'returned', note: 'Chybí razítko lékaře.' });
    expect(mail().sent.map(({ to }) => to)).toEqual([['jana.testovaci@example.com'], ['petr.testovaci@example.com']]);

    mail().sent.length = 0;
    await http()
      .put(`/api/camps/${campId}/email-texts/document_returned`)
      .set(owner)
      .send({ subject: 'Vráceno', text: 'Nahrajte znovu.', enabled: false });
    const again = await handIn();
    await http().post(`/api/document-uploads/${again}/return`).set(owner).send({ note: 'Stále chybí.' });
    await jobs().drain();
    expect(mail().sent).toEqual([]);
  });

  it('hands in on behalf of the guardians, Approved by the admin, and marks one handed in on paper', async () => {
    await http().post(`${childPath()}/documents/${requirementId}`).set(owner).attach('file', PDF, 'potvrzeni.pdf');

    expect(await statuses()).toEqual([{ status: 'approved', byAdmin: true, file: true }]);
    expect((await http().post(`${childPath()}/documents/${requirementId}/paper`).set(owner)).body.code).toBe(
      'document_review_stale',
    );

    const swimming = (
      await http()
        .post(`/api/camps/${campId}/document-types`)
        .set(owner)
        .send({ kind: 'requirement', name: 'Plavecký průkaz', description: '', dueDate: null, turnusIds: [] })
    ).body.id;
    expect((await http().post(`${childPath()}/documents/${swimming}/paper`).set(owner)).body).toMatchObject({
      status: 'approved',
      byAdmin: true,
      file: null,
    });
    expect(
      (await query<{ action: string }>(`SELECT action FROM audit_entries WHERE action LIKE 'document_upload.%'`)).map(
        ({ action }) => action,
      ),
    ).toEqual(['document_upload.create', 'document_upload.paper']);
  });

  it('keeps Internal documents out of every guardian endpoint', async () => {
    await handIn();
    const internal = await http()
      .post(`${childPath()}/internal-documents`)
      .set(owner)
      .attach('file', INTERNAL, 'zapis.pdf');
    const [row] = await query<{ id: string; file_id: string }>('SELECT id, file_id FROM internal_documents');

    expect(internal.body).toMatchObject({ name: 'zapis.pdf' });
    const portal = [
      '/api/portal/registrations',
      `/api/portal/registrations/${registrationId}`,
      `/api/portal/registrations/${registrationId}/edit`,
      `/api/portal/registrations/${registrationId}/consents`,
      `/api/portal/registrations/${registrationId}/documents`,
    ];
    for (const path of portal) {
      const body = JSON.stringify((await http().get(path).set(guardian)).body);

      expect(body).not.toContain(row?.id);
      expect(body).not.toContain(row?.file_id);
      expect(body).not.toContain('zapis.pdf');
    }

    await http().delete(`/api/internal-documents/${row?.id}`).set(owner);
    expect(await query('SELECT FROM internal_documents')).toEqual([]);
  });

  it('audits every opening of an Internal document, for Registrations read, within its Organisation', async () => {
    await http().post(`${childPath()}/internal-documents`).set(owner).attach('file', INTERNAL, 'zapis.pdf');
    const [row] = await query<{ id: string }>('SELECT id FROM internal_documents');
    const open = (headers = owner) => http().post(`/api/internal-documents/${row?.id}/open`).set(headers);
    const listed = await http().get(`/api/registrations/${registrationId}/documents`).set(owner);

    expect(listed.body.participants[0].internal).toEqual([
      { id: row?.id, name: 'zapis.pdf', uploadedAt: expect.any(String) },
    ]);
    const link = await open();
    expect(link.status).toBe(201);
    expect((await http().get(link.body.url)).body).toEqual(INTERNAL);
    await open();
    // Each view is on the child's record, telling its documents apart by when they were uploaded.
    const views = () =>
      query(
        `SELECT actor_kind, target_type, target_id, changes->'uploadedAt'->>'new' AS uploaded_at
           FROM audit_entries WHERE action = 'internal_document.view'`,
      );
    const view = {
      actor_kind: 'admin',
      target_type: 'participant',
      target_id: participantId,
      uploaded_at: expect.any(String),
    };
    expect(await views()).toEqual([view, view]);

    await expectPermission(['registrations', 'read'], organisationId, (headers) => open(headers));
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);
    await expectIsolated(() => open(otherOwner));
  });

  it('lets Registrations read view but not review, and keeps another Organisation away', async () => {
    const uploadId = await handIn();
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['registrations', 'read'], organisationId, (headers) =>
      http().get(`/api/registrations/${registrationId}/documents`).set(headers),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/document-uploads/${uploadId}/approve`).set(headers),
    );
    await expectIsolated(() => http().post(`/api/document-uploads/${uploadId}/approve`).set(otherOwner));
  });
});
