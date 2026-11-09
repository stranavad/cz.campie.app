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

const RULES_ITEM = '0190a2b4-0000-7000-8000-0000000000a1';
const PHOTOS_ITEM = '0190a2b4-0000-7000-8000-0000000000a2';
const PDF = Buffer.from('%PDF-1.7 zkušební potvrzení');
const CHILDREN = ['Adam', 'Bára', 'Cyril', 'Dana', 'Eva', 'Filip'] as const;

type Child = (typeof CHILDREN)[number];

interface Row {
  firstName: string;
  submittedAt: string;
  consents: { signed: number; required: number } | null;
  documents: string | null;
}

describe('participant list signals', () => {
  const { app, http, clock, database, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let guardian: RequestHeaders;
  let turnusId: string;
  let rules: { id: string; versionId: string };
  let photos: { id: string; versionId: string };
  let medical: string;
  let swimming: string;
  const registrationOf = {} as Record<Child, string>;
  const participantOf = {} as Record<Child, string>;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const rows = async (filters: Record<string, string> = {}, headers = owner) =>
    (await http().get(`/api/turnusy/${turnusId}/participants`).query(filters).set(headers)).body as Row[];
  const byName = async (filters: Record<string, string> = {}) =>
    Object.fromEntries((await rows(filters)).map(({ firstName, ...row }) => [firstName, row]));
  const names = async (filters: Record<string, string>) =>
    (await rows(filters)).map(({ firstName }) => firstName).toSorted();
  const childPath = (child: Child) => `/registrations/${registrationOf[child]}/participants/${participantOf[child]}`;
  const sign = (child: Child, consent: { id: string; versionId: string }, item: string) =>
    http()
      .post(`/api/portal${childPath(child)}/consents/${consent.id}/signatures`)
      .set(guardian)
      .send({
        consentVersionId: consent.versionId,
        answers: { [item]: true },
        signerName: 'Jana Testovací',
        signerPlace: 'Testov',
      });
  const handIn = (child: Child, requirement: string) =>
    http()
      .post(`/api/portal${childPath(child)}/documents/${requirement}`)
      .set(guardian)
      .attach('file', PDF, 'potvrzeni.pdf');
  const uploadOf = async (child: Child, requirement: string) =>
    (
      await query<{ id: string }>(
        'SELECT id FROM document_uploads WHERE participant_id = $1 AND document_type_id = $2',
        [participantOf[child], requirement],
      )
    )[0]?.id ?? '';
  const createConsent = async (title: string, item: string, withdrawable: boolean) => {
    const { body } = await http()
      .post(`/api/camps/${campId}/consents`)
      .set(owner)
      .send({
        title,
        introduction: '',
        items: [{ id: item, kind: 'must_agree', text: 'Souhlasím.' }],
        withdrawable,
        fileId: null,
      });

    return { id: body.id as string, versionId: body.versions[0].id as string };
  };
  const createRequirement = async (name: string) =>
    (
      await http()
        .post(`/api/camps/${campId}/document-types`)
        .set(owner)
        .send({ kind: 'requirement', name, description: '', dueDate: null, turnusIds: [] })
    ).body.id as string;

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T00:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: true, documents: true } });
    rules = await createConsent('Táborový řád', RULES_ITEM, false);
    photos = await createConsent('Fotografování', PHOTOS_ITEM, true);
    medical = await createRequirement('Potvrzení od lékaře');
    swimming = await createRequirement('Plavecký průkaz');
    turnusId = '';

    for (const [index, firstName] of CHILDREN.entries()) {
      clock().set(new Date(`2027-04-10T0${index}:30:00Z`));
      registrationOf[firstName] = (
        await submitRegistration(app(), organisationId, campId, {
          children: [{ firstName, lastName: 'Testovací', birthDate: '2016-05-01' }],
          ...(turnusId === '' ? {} : { turnusId }),
        })
      ).id;
      const [row] = await query<{ id: string; turnus_id: string }>(
        'SELECT participants.id, turnus_id FROM participants JOIN registrations ON registrations.id = registration_id WHERE registration_id = $1',
        [registrationOf[firstName]],
      );
      participantOf[firstName] = row?.id ?? '';
      turnusId ||= row?.turnus_id ?? '';
    }

    // Adam has everything: both Consents signed, one document approved and one handed in on paper.
    await sign('Adam', rules, RULES_ITEM);
    await sign('Adam', photos, PHOTOS_ITEM);
    await http()
      .post(`/api${childPath('Adam')}/documents/${medical}`)
      .set(owner)
      .attach('file', PDF, 'potvrzeni.pdf');
    await http()
      .post(`/api${childPath('Adam')}/documents/${swimming}/paper`)
      .set(owner);
    // Bára signed one Consent and handed in nothing.
    await sign('Bára', rules, RULES_ITEM);
    // Cyril withdrew the photos, and one document waits for review.
    await sign('Cyril', rules, RULES_ITEM);
    await sign('Cyril', photos, PHOTOS_ITEM);
    await http()
      .post(`/api/portal${childPath('Cyril')}/consents/${photos.id}/withdrawal`)
      .set(guardian);
    await handIn('Cyril', medical);
    await http()
      .post(`/api${childPath('Cyril')}/documents/${swimming}/paper`)
      .set(owner);
    // Dana's document came back, the other one is on paper.
    await handIn('Dana', medical);
    await http()
      .post(`/api/document-uploads/${await uploadOf('Dana', medical)}/return`)
      .set(owner)
      .send({ note: 'Chybí razítko.' });
    await http()
      .post(`/api${childPath('Dana')}/documents/${swimming}/paper`)
      .set(owner);
    // Eva has one waiting and one missing, which outweighs it.
    await handIn('Eva', medical);
    // Filip is Cancelled.
    await http().post(`/api/registrations/${registrationOf.Filip}/cancel`).set(owner);
  });

  it('shows when each child was registered, Consent counts and the document status', async () => {
    expect(await byName()).toEqual({
      Adam: expect.objectContaining({
        submittedAt: '2027-04-10T00:30:00.000Z',
        consents: { signed: 2, required: 2 },
        documents: 'complete',
      }),
      Bára: expect.objectContaining({
        submittedAt: '2027-04-10T01:30:00.000Z',
        consents: { signed: 1, required: 2 },
        documents: 'missing',
      }),
      // A Withdrawn Consent is the guardians' answer: nothing is left to chase.
      Cyril: expect.objectContaining({ consents: { signed: 2, required: 2 }, documents: 'to_review' }),
      Dana: expect.objectContaining({ consents: { signed: 0, required: 2 }, documents: 'missing' }),
      Eva: expect.objectContaining({ consents: { signed: 0, required: 2 }, documents: 'missing' }),
      Filip: expect.objectContaining({ submittedAt: '2027-04-10T05:30:00.000Z', consents: null, documents: null }),
    });
  });

  it('keeps the filters finding the same children', async () => {
    expect(await names({ unsignedConsent: 'true' })).toEqual(['Bára', 'Dana', 'Eva']);
    expect(await names({ missingDocument: 'true' })).toEqual(['Bára', 'Dana', 'Eva']);
    expect(await names({ unsignedConsent: 'true', missingDocument: 'true' })).toEqual(['Bára', 'Dana', 'Eva']);
  });

  it('shows no counts, no document status and nothing to review while the Camp has the modules off', async () => {
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: false, documents: false } });

    expect((await rows()).map(({ consents, documents }) => ({ consents, documents }))).toEqual(
      CHILDREN.map(() => ({ consents: null, documents: null })),
    );
    expect((await http().get(`/api/turnusy/${turnusId}/overview`).set(owner)).body.documentsToReview).toBe(0);
  });

  it('counts Pending documents of Registered children in the Turnus overview', async () => {
    const overview = () => http().get(`/api/turnusy/${turnusId}/overview`).set(owner);

    // Cyril's and Eva's wait; Dana's was returned, Adam's approved.
    expect((await overview()).body.documentsToReview).toBe(2);

    // One handed in for another Turnus of the Camp waits there, not here.
    const elsewhere = await submitRegistration(app(), organisationId, campId);
    const [elsewhereChild] = await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [
      elsewhere.id,
    ]);
    await http()
      .post(`/api/portal/registrations/${elsewhere.id}/participants/${elsewhereChild?.id}/documents/${medical}`)
      .set(guardian)
      .attach('file', PDF, 'potvrzeni.pdf');
    expect((await overview()).body.documentsToReview).toBe(2);

    // Bára's waits until an admin hands one in over it, which leaves nothing to review.
    await handIn('Bára', medical);
    expect((await overview()).body.documentsToReview).toBe(3);
    await http()
      .post(`/api${childPath('Bára')}/documents/${medical}`)
      .set(owner)
      .attach('file', PDF, 'potvrzeni.pdf');
    expect((await overview()).body.documentsToReview).toBe(2);

    await http()
      .post(`/api/document-uploads/${await uploadOf('Cyril', medical)}/approve`)
      .set(owner);
    await http().post(`/api/registrations/${registrationOf.Eva}/cancel`).set(owner);

    expect((await overview()).body.documentsToReview).toBe(0);
  });

  it("never counts another Organisation's Consents or documents", async () => {
    const otherId = await createOrganisation(app());
    const otherCamp = await createCamp(app(), otherId, 'Zimní tábor', 'zimni-tabor');
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);
    const otherCampBody = (await http().get(`/api/camps/${otherCamp}`).set(otherOwner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${otherCamp}`)
      .set(otherOwner)
      .send({ modules: { ...otherCampBody.modules, consents: true, documents: true } });
    await http()
      .post(`/api/camps/${otherCamp}/consents`)
      .set(otherOwner)
      .send({
        title: 'Cizí souhlas',
        introduction: '',
        items: [{ id: RULES_ITEM, kind: 'must_agree', text: 'Souhlasím.' }],
        withdrawable: false,
        fileId: null,
      });
    const otherRequirement = (
      await http()
        .post(`/api/camps/${otherCamp}/document-types`)
        .set(otherOwner)
        .send({ kind: 'requirement', name: 'Cizí dokument', description: '', dueDate: null, turnusIds: [] })
    ).body.id as string;
    const other = await submitRegistration(app(), otherId, otherCamp);
    const [otherChild] = await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [
      other.id,
    ]);
    const otherGuardian = (await createGuardianSession(app(), otherId, 'jana.testovaci@example.com')).headers;
    expect(
      (
        await http()
          .post(`/api/portal/registrations/${other.id}/participants/${otherChild?.id}/documents/${otherRequirement}`)
          .set(otherGuardian)
          .attach('file', PDF, 'potvrzeni.pdf')
      ).status,
    ).toBe(201);

    expect((await rows()).map(({ consents }) => consents?.required ?? null)).toEqual([2, 2, 2, 2, 2, null]);
    expect((await http().get(`/api/turnusy/${turnusId}/overview`).set(owner)).body.documentsToReview).toBe(2);
  });

  it('takes Registrations read, and shows nothing of health', async () => {
    await expectPermission(['registrations', 'read'], organisationId, (headers) =>
      http().get(`/api/turnusy/${turnusId}/participants`).set(headers),
    );
    const reader = (
      await createAdmin(app(), { memberOf: [organisationId], permissions: { registrations: 'read', health: 'none' } })
    ).headers(organisationId);

    expect(Object.keys((await rows({}, reader))[0] ?? {}).toSorted()).toEqual([
      'ageOnStart',
      'amountDue',
      'consents',
      'documents',
      'emailUndeliverable',
      'firstName',
      'guardianEmail',
      'guardianName',
      'lastName',
      'missingAnswers',
      'overdue',
      'participantId',
      'paymentStatus',
      'registrationId',
      'status',
      'submittedAt',
      'unverifiedClaimedDiscount',
      'variableSymbol',
    ]);
  });
});
