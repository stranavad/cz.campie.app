import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
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
import { ConsentSignatureService } from './services/consent-signature.service.ts';

const INFO = '0190a2b4-0000-7000-8000-0000000000d1';
const RULES = '0190a2b4-0000-7000-8000-0000000000d2';
const PHOTOS = '0190a2b4-0000-7000-8000-0000000000d3';
const CONTENT = {
  title: 'Souhlas s táborovým řádem',
  introduction: 'Přečtěte si prosím táborový řád.',
  items: [
    { id: INFO, kind: 'information', text: 'Tábor pořádá zkušební spolek.' },
    { id: RULES, kind: 'must_agree', text: 'Souhlasím s táborovým řádem.' },
    { id: PHOTOS, kind: 'yes_no', text: 'Souhlasím s fotografováním dítěte.' },
  ],
  withdrawable: false,
  fileId: null,
};

describe('signing Consents', () => {
  const { app, http, clock, database, jobs, mail, files, pdfs, expectIsolated } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let registrationId: string;
  let participantId: string;
  let consentId: string;
  let versionId: string;
  let guardian: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const consentPath = (registration = registrationId, participant = participantId, consent = consentId) =>
    `/api/portal/registrations/${registration}/participants/${participant}/consents/${consent}`;
  const sign = (headers: RequestHeaders, answers: object = { [RULES]: true, [PHOTOS]: false }, version = versionId) =>
    http()
      .post(`${consentPath()}/signatures`)
      .set(headers)
      .set('user-agent', 'TestBrowser/1.0')
      .send({ consentVersionId: version, answers, signerName: 'Jana Testovací', signerPlace: 'Testov' });
  const switchConsents = async (on: boolean) => {
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: on } });
  };

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    await switchConsents(true);
    const consent = await http().post(`/api/camps/${campId}/consents`).set(owner).send(CONTENT);
    consentId = consent.body.id;
    versionId = consent.body.versions[0].id;
    registrationId = (await submitRegistration(app(), organisationId, campId, { secondGuardian: true })).id;
    participantId =
      (await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [registrationId]))[0]
        ?.id ?? '';
    guardian = (await createGuardianSession(app(), organisationId, 'petr.testovaci@example.com')).headers;
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('lists the Consents of each child as unsigned, and shows one in full to read', async () => {
    const listed = await http().get(`/api/portal/registrations/${registrationId}/consents`).set(guardian);
    const shown = await http().get(consentPath()).set(guardian);

    expect(listed.body.participants).toMatchObject([
      { id: participantId, consents: [{ consentId, title: CONTENT.title, state: 'unsigned', signedPdf: null }] },
    ]);
    expect(shown.body).toMatchObject({ version: { id: versionId, items: CONTENT.items }, signature: null });
  });

  it('refuses signing without agreeing to a must-agree item, naming the item', async () => {
    const response = await sign(guardian, { [RULES]: false, [PHOTOS]: true });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'consent_answers_invalid',
      fields: [{ path: ['answers', RULES], code: 'consent_agreement_required' }],
    });
  });

  it('stores the signature with its evidence, audited, and makes, stores and emails the signed PDF', async () => {
    const response = await sign(guardian);

    expect(response.status).toBe(201);
    const [signature] = await query<Record<string, unknown>>('SELECT * FROM consent_signatures');
    expect(signature).toMatchObject({
      participant_id: participantId,
      consent_version_id: versionId,
      answers: { [RULES]: true, [PHOTOS]: false },
      signer_name: 'Jana Testovací',
      signer_place: 'Testov',
      signer_email: 'petr.testovaci@example.com',
      ip_address: expect.any(String),
      user_agent: 'TestBrowser/1.0',
      file_id: null,
    });
    expect(await query(`SELECT actor_kind, actor_identity FROM audit_entries WHERE action = 'consent.sign'`)).toEqual([
      { actor_kind: 'guardian', actor_identity: 'petr.testovaci@example.com' },
    ]);
    await expect(
      withClient(database().appUrl, (client) => client.query(`UPDATE consent_signatures SET signer_name = 'Jiný'`)),
    ).rejects.toThrow(/permission denied/);

    await jobs().drain();

    const [stored] = await query<{ file_id: string }>('SELECT file_id FROM consent_signatures');
    expect(stored?.file_id).toEqual(expect.any(String));
    expect(pdfs().rendered.at(-1)).toContain('Jana Testovací');
    expect([...files().objects.values()].some((object) => object.includes('Jana Testovací'))).toBe(false);
    const copies = mail().sent.filter(({ subject }) => subject.startsWith('Kopie podepsaného souhlasu'));
    expect(copies.map(({ to }) => to)).toEqual([['jana.testovaci@example.com'], ['petr.testovaci@example.com']]);
    expect(copies[0]?.attachments).toHaveLength(1);
    expect(
      (await http().get(`/api/portal/registrations/${registrationId}/consents`).set(guardian)).body.participants[0]
        .consents[0],
    ).toMatchObject({ state: 'signed', signedVersion: 1, signedPdf: { url: expect.any(String) } });
  });

  it('sends no copy when the Camp switched it off', async () => {
    await http()
      .put(`/api/camps/${campId}/email-texts/consent_copy`)
      .set(owner)
      .send({ subject: 'Kopie podepsaného souhlasu', text: 'V příloze.', enabled: false });

    await sign(guardian);
    await jobs().drain();

    expect(mail().sent).toEqual([]);
  });

  it('records signing the same answers again as nothing new, and sends no second copy', async () => {
    await sign(guardian);
    await sign(guardian);
    await jobs().drain();

    expect(await query('SELECT FROM consent_signatures')).toHaveLength(1);
    expect(mail().sent.filter(({ subject }) => subject.startsWith('Kopie podepsaného souhlasu'))).toHaveLength(2);
  });

  it('refuses a version replaced meanwhile', async () => {
    await http()
      .put(`/api/camps/${campId}/consents/${consentId}`)
      .set(owner)
      .send({ ...CONTENT, title: 'Nové znění' });

    expect((await sign(guardian)).body.code).toBe('consent_version_outdated');
  });

  it('lets an access email sign, but not a guardian of another family, nor with the module off', async () => {
    await http()
      .post(`/api/registrations/${registrationId}/access-emails`)
      .set(owner)
      .send({ email: 'babicka.testovaci@example.com' });
    const access = (await createGuardianSession(app(), organisationId, 'babicka.testovaci@example.com')).headers;
    const stranger = (await createGuardianSession(app(), organisationId, 'cizi.rodic@example.com')).headers;

    expect((await sign(access)).status).toBe(201);
    expect((await sign(stranger)).status).toBe(404);
    await switchConsents(false);
    expect((await sign(guardian)).status).toBe(404);
    expect((await http().get(`/api/portal/registrations/${registrationId}/consents`).set(guardian)).body).toEqual({
      participants: [],
    });
  });

  it('keeps a guardian session of another Organisation away', async () => {
    const otherId = await createOrganisation(app());
    const other = (await createGuardianSession(app(), otherId, 'petr.testovaci@example.com')).headers;

    await expectIsolated(() => sign(other));
    await expectIsolated(() => http().get(consentPath()).set(other));
  });

  describe('withdrawing, signing again and Declined items', () => {
    const withdraw = (headers = guardian) => http().post(`${consentPath()}/withdrawal`).set(headers);
    const stateNow = async () =>
      (await http().get(`/api/portal/registrations/${registrationId}/consents`).set(guardian)).body.participants[0]
        .consents[0];
    const declined = () =>
      app()
        .get(UnitOfWork)
        .run(organisationId, () => app().get(ConsentSignatureService).declinedItemsOf([participantId]));
    const makeWithdrawable = async () => {
      const published = await http()
        .put(`/api/camps/${campId}/consents/${consentId}`)
        .set(owner)
        .send({ ...CONTENT, withdrawable: true });
      versionId = published.body.versions[0].id;
    };

    it('refuses to withdraw a Consent that cannot be withdrawn, or one not signed', async () => {
      expect((await withdraw()).body.code).toBe('consent_not_signed');
      await sign(guardian);

      expect((await withdraw()).body.code).toBe('consent_not_withdrawable');
    });

    it('withdraws a withdrawable signature, audited, keeping its signed PDF', async () => {
      await makeWithdrawable();
      await sign(guardian);
      await jobs().drain();

      const response = await withdraw();

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ withdrawable: false, signature: { withdrawnAt: expect.any(String) } });
      expect(await stateNow()).toMatchObject({ state: 'withdrawn', signedPdf: { url: expect.any(String) } });
      expect(await query(`SELECT actor_kind FROM audit_entries WHERE action = 'consent.withdraw'`)).toEqual([
        { actor_kind: 'guardian' },
      ]);
      expect((await withdraw()).body.code).toBe('consent_not_signed');
    });

    it('keeps every signature when signing again, the newest in force, and a new version changes nothing', async () => {
      await sign(guardian, { [RULES]: true, [PHOTOS]: false });
      expect(await declined()).toEqual([
        { participantId, consentId, itemId: PHOTOS, text: 'Souhlasím s fotografováním dítěte.' },
      ]);

      await sign(guardian, { [RULES]: true, [PHOTOS]: true });
      expect(await query('SELECT FROM consent_signatures')).toHaveLength(2);
      expect(await declined()).toEqual([]);

      await http()
        .put(`/api/camps/${campId}/consents/${consentId}`)
        .set(owner)
        .send({ ...CONTENT, title: 'Nové znění' });
      expect(await stateNow()).toMatchObject({ state: 'signed', signedVersion: 1 });
    });

    it('reads no Declined item from a withdrawn signature', async () => {
      await makeWithdrawable();
      await sign(guardian, { [RULES]: true, [PHOTOS]: false });
      await withdraw();

      expect(await declined()).toEqual([]);
    });
  });
});
