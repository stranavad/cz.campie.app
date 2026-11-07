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

const RULES = '0190a2b4-0000-7000-8000-0000000000e1';
const PHOTOS = '0190a2b4-0000-7000-8000-0000000000e2';
const CONTENT = {
  title: 'Souhlas s fotografováním',
  introduction: '',
  items: [
    { id: RULES, kind: 'must_agree', text: 'Souhlasím s pravidly.' },
    { id: PHOTOS, kind: 'yes_no', text: 'Souhlasím s fotografováním dítěte.' },
  ],
  withdrawable: true,
  fileId: null,
};

describe('Consent status for admins', () => {
  const { app, http, clock, database, jobs, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let owner: RequestHeaders;
  let registrationId: string;
  let turnusId: string;
  let participantId: string;
  let consentId: string;
  let guardian: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const portalPath = () =>
    `/api/portal/registrations/${registrationId}/participants/${participantId}/consents/${consentId}`;
  const sign = async (photos: boolean) => {
    const versionId = (await http().get(portalPath()).set(guardian)).body.version.id;

    await http()
      .post(`${portalPath()}/signatures`)
      .set(guardian)
      .send({
        consentVersionId: versionId,
        answers: { [RULES]: true, [PHOTOS]: photos },
        signerName: 'Jana Testovací',
        signerPlace: 'Testov',
      });
  };
  const ofRegistration = async (headers = owner) =>
    (await http().get(`/api/registrations/${registrationId}/consents`).set(headers)).body.participants[0].consents[0];

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    const campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: true } });
    consentId = (await http().post(`/api/camps/${campId}/consents`).set(owner).send(CONTENT)).body.id;
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
    const [row] = await query<{ id: string; turnus_id: string }>(
      'SELECT p.id, r.turnus_id FROM participants p JOIN registrations r ON r.id = p.registration_id WHERE r.id = $1',
      [registrationId],
    );
    participantId = row?.id ?? '';
    turnusId = row?.turnus_id ?? '';
    guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
  });

  it('follows each child from unsigned to signed, superseded and Withdrawn, with the items declined', async () => {
    expect(await ofRegistration()).toMatchObject({ state: 'unsigned', signatures: [] });

    await sign(false);
    expect(await ofRegistration()).toMatchObject({
      state: 'signed',
      declinedItems: ['Souhlasím s fotografováním dítěte.'],
      signatures: [{ version: 1, superseded: false, withdrawnAt: null }],
    });

    await sign(true);
    expect(await ofRegistration()).toMatchObject({
      state: 'signed',
      declinedItems: [],
      signatures: [{ superseded: false }, { superseded: true }],
    });

    await http().post(`${portalPath()}/withdrawal`).set(guardian);
    expect(await ofRegistration()).toMatchObject({
      state: 'withdrawn',
      signatures: [{ withdrawnAt: expect.any(String) }, { superseded: true }],
    });
    expect((await http().get(`/api/turnusy/${turnusId}/consents`).set(owner)).body).toEqual({
      consents: [{ id: consentId, title: CONTENT.title }],
      participants: [expect.objectContaining({ id: participantId, states: { [consentId]: 'withdrawn' } })],
    });
  });

  it('gives an audited, short-lived link to any signed PDF, superseded ones too', async () => {
    await sign(false);
    await sign(true);
    await jobs().drain();
    const [, superseded] = (await ofRegistration()).signatures as { id: string }[];

    const link = await http().post(`/api/consent-signatures/${superseded?.id}/download`).set(owner);

    expect(link.status).toBe(201);
    expect((await http().get(link.body.url)).status).toBe(200);
    expect(await query(`SELECT target_id FROM audit_entries WHERE action = 'consent_signature.download'`)).toEqual([
      { target_id: superseded?.id },
    ]);
    clock().set(new Date('2027-04-10T10:06:00Z'));
    expect((await http().get(link.body.url)).status).not.toBe(200);
  });

  it('takes Registrations read, and keeps another Organisation away from a guessed signature', async () => {
    await sign(true);
    await jobs().drain();
    const [signature] = (await ofRegistration()).signatures as { id: string }[];
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['registrations', 'read'], organisationId, (headers) =>
      http().get(`/api/registrations/${registrationId}/consents`).set(headers),
    );
    await expectIsolated(() => http().post(`/api/consent-signatures/${signature?.id}/download`).set(otherOwner));
  });
});
