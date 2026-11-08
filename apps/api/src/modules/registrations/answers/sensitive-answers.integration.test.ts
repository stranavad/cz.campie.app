import ExcelJS from 'exceljs';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

// A made-up rodné číslo with a valid checksum, of a boy born on the fixture's birth date; nobody's.
const BIRTH_NUMBER = '160501/0011';
const HEALTH_NOTE = 'Alergie na pyl, nosí s sebou sprej';
const ALLERGY = '0190a2b4-0000-7000-8000-0000000000c1';
const ALLERGY_ANSWER = 'Laktóza';
const PLACE = 'misto-1';

const allergy = {
  id: ALLERGY,
  type: 'short_text',
  label: 'Nesnášenlivost potravin',
  hint: null,
  required: false,
  scope: 'participant',
  health: true,
};

const answersOf = (answers: Record<string, string> = {}) => ({
  firstName: 'Ema',
  lastName: 'Testovací',
  birthDate: '2016-05-01',
  birthNumber: BIRTH_NUMBER,
  insurer: '111',
  healthNote: HEALTH_NOTE,
  [ALLERGY]: ALLERGY_ANSWER,
  ...answers,
});

describe('encrypted answers and health data', () => {
  const { app, http, clock, database, jobs, pdfs } = useTestApp();

  let organisationId: string;
  let campId: string;
  let registrationId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const adminWith = async (registrations: 'read' | 'write', health: 'none' | 'read' | 'write') =>
    (await createAdmin(app(), { memberOf: [organisationId], permissions: { registrations, health } })).headers(
      organisationId,
    );
  const detail = (headers: RequestHeaders) => http().get(`/api/registrations/${registrationId}`).set(headers);
  const editAnswers = async (headers: RequestHeaders, answers: object) => {
    const participantId = (await query<{ id: string }>('SELECT id FROM participants'))[0]?.id;

    return http()
      .put(`/api/registrations/${registrationId}/answers`)
      .set(headers)
      .send({ registration: {}, participants: [{ participantId, answers }], expectedLines: [] });
  };
  const exportRows = async (headers: RequestHeaders) => {
    const turnusId = (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations'))[0]?.turnus_id;
    const started = await http().post(`/api/turnusy/${turnusId}/exports`).set(headers).send({});
    await jobs().drain();
    const ready = await http().get(`/api/exports/${started.body.id}`).set(headers);
    const file = await http()
      .get(ready.body.file.url)
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => done(null, Buffer.concat(chunks)));
      });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Uint8Array.from(file.body as Buffer).buffer);
    const rows: unknown[][] = [];
    workbook.worksheets[0]?.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));

    return rows;
  };

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({
        definition: {
          standard: [
            { key: 'birthNumber', state: 'required' },
            { key: 'insurer', state: 'optional' },
            { key: 'healthNote', state: 'optional' },
            { key: 'transport', state: 'optional', options: [{ id: PLACE, label: 'Praha, Florenc' }] },
          ],
          custom: [allergy],
        },
        maxParticipants: 3,
        declarations: [],
      });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
    registrationId = (await submitRegistration(app(), organisationId, campId, { children: [answersOf()] })).id;
  });

  it('stores the rodné číslo and health data only as ciphertext', async () => {
    const [stored] = await query<{ answers: object; encrypted_answers: Buffer }>(
      'SELECT answers, encrypted_answers FROM participants',
    );

    expect(stored?.answers).toEqual({ insurer: '111' });
    expect(stored?.encrypted_answers.toString('latin1')).not.toMatch(/160501|pyl|Laktóza/);
  });

  it('audits the submission with the encrypted answers by name only', async () => {
    const [entry] = await query<{ changes: object; encrypted_fields: string[] }>(
      `SELECT changes, encrypted_fields FROM audit_entries WHERE action = 'registration.submit'`,
    );

    expect(entry?.encrypted_fields.toSorted()).toEqual([ALLERGY, 'birthNumber', 'healthNote']);
    expect(JSON.stringify(entry?.changes)).not.toMatch(/160501|pyl|Laktóza/);
  });

  it('refuses a rodné číslo of another birth date, or with a wrong checksum, at its field', async () => {
    await expect(
      submitRegistration(app(), organisationId, campId, { children: [answersOf({ birthDate: '2016-05-02' })] }),
    ).rejects.toMatchObject({
      response: { fields: [{ path: ['participants', 0, 'birthNumber'], code: 'form_birth_number_mismatch' }] },
    });
    await expect(
      submitRegistration(app(), organisationId, campId, { children: [answersOf({ birthNumber: '160501/0012' })] }),
    ).rejects.toMatchObject({
      response: { fields: [{ path: ['participants', 0, 'birthNumber'], code: 'form_answer_invalid' }] },
    });
  });

  it('shows health data only to an admin with Health read', async () => {
    const withoutHealth = (await detail(await adminWith('read', 'none'))).body.participants[0].answers;
    const withHealth = (await detail(owner)).body.participants[0].answers;

    expect(withoutHealth.map(({ key }: { key: string }) => key)).toEqual(['birthNumber', 'insurer']);
    expect(withoutHealth[0]).toMatchObject({ key: 'birthNumber', value: BIRTH_NUMBER });
    expect(withoutHealth[1]).toMatchObject({ value: '111', option: { labelKey: 'form.standard.insurer.options.111' } });
    expect(withHealth).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'healthNote', value: HEALTH_NOTE }),
        expect.objectContaining({ key: ALLERGY, value: ALLERGY_ANSWER }),
      ]),
    );
  });

  it('audits each view that shows health data, and no other', async () => {
    await detail(await adminWith('read', 'none'));
    await detail(owner);

    expect(await query(`SELECT target_id FROM audit_entries WHERE action = 'health_answers.view'`)).toEqual([
      { target_id: registrationId },
    ]);
  });

  it('names changed health fields in the history only to an admin with Health read', async () => {
    const history = async (headers: RequestHeaders) =>
      (await http().get(`/api/registrations/${registrationId}/history`).set(headers)).body.find(
        ({ action }: { action: string }) => action === 'registration.submit',
      ).encryptedFields;

    expect(await history(await adminWith('read', 'none'))).toEqual(['birthNumber']);
    expect((await history(owner)).toSorted()).toEqual([ALLERGY, 'birthNumber', 'healthNote']);
  });

  it('needs Health write for an admin to change health data', async () => {
    const writer = await adminWith('write', 'read');

    const refused = await editAnswers(writer, { healthNote: 'Bez omezení' });
    const allowed = await editAnswers(writer, { insurer: '207' });

    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ code: 'permission_denied' });
    expect(allowed.status).toBe(200);
  });

  it('audits a change of encrypted answers by the names of those changed only', async () => {
    await editAnswers(owner, { birthNumber: BIRTH_NUMBER, insurer: '207' });
    await editAnswers(owner, { healthNote: 'Bez omezení' });

    const edits = await query<{ changes: object; encrypted_fields: string[] }>(
      `SELECT changes, encrypted_fields FROM audit_entries WHERE action = 'registration.edit' ORDER BY occurred_at, id`,
    );

    expect(edits.map(({ encrypted_fields }) => encrypted_fields)).toEqual([[], ['healthNote']]);
    expect(JSON.stringify(edits)).not.toMatch(/160501|Bez omezení|pyl/);
  });

  it('checks a changed birth date against the rodné číslo kept', async () => {
    const changed = await editAnswers(owner, { birthDate: '2016-05-02' });

    expect(changed.status).toBe(400);
    expect(changed.body.fields).toEqual([
      { path: ['participants', 0, 'birthNumber'], code: 'form_birth_number_mismatch' },
    ]);
  });

  it('exports health columns only with Health read, the rodné číslo decrypted in the file', async () => {
    const [headers, row] = await exportRows(await adminWith('read', 'none'));
    const [ownerHeaders, ownerRow] = await exportRows(owner);

    expect(headers).toEqual(expect.arrayContaining(['Rodné číslo', 'Zdravotní pojišťovna', 'Doprava na tábor']));
    expect(headers).not.toContain('Zdravotní stav, alergie a léky');
    expect(headers).not.toContain('Nesnášenlivost potravin');
    expect(row?.[headers?.indexOf('Rodné číslo') ?? -1]).toBe(BIRTH_NUMBER);
    expect(row?.[headers?.indexOf('Zdravotní pojišťovna') ?? -1]).toBe(
      '111 - Všeobecná zdravotní pojišťovna České republiky',
    );
    expect(JSON.stringify(row)).not.toMatch(/pyl|Laktóza/);
    expect(ownerRow?.[ownerHeaders?.indexOf('Zdravotní stav, alergie a léky') ?? -1]).toBe(HEALTH_NOTE);
    expect(ownerRow?.[ownerHeaders?.indexOf('Nesnášenlivost potravin') ?? -1]).toBe(ALLERGY_ANSWER);
  });

  it('names the sensitive columns an export holds in its audit entry', async () => {
    await exportRows(await adminWith('read', 'none'));
    await exportRows(owner);

    const entries = await query<{ changes: { sensitiveColumns: { new: string[] } } }>(
      `SELECT changes FROM audit_entries WHERE action = 'export.create' ORDER BY occurred_at, id`,
    );

    expect(entries.map(({ changes }) => changes.sensitiveColumns.new.toSorted())).toEqual([
      ['field:birthNumber'],
      [`field:${ALLERGY}`, 'field:birthNumber', 'field:healthNote'],
    ]);
  });

  it('prints the rodné číslo and the standard answers in Czech on the Přihláška, never health data', async () => {
    await submitRegistration(app(), organisationId, campId, { children: [answersOf()], answers: { transport: PLACE } });
    await jobs().drain();

    const [first, second] = pdfs().rendered;

    expect(first).toContain('Rodné číslo');
    expect(first).toContain(BIRTH_NUMBER);
    expect(first).toContain('111 - Všeobecná zdravotní pojišťovna České republiky');
    expect(`${first}${second}`).not.toMatch(/pyl|Laktóza|Zdravotní stav/);
    expect(second).toContain('Praha, Florenc');
  });

  it("takes a transport answer only of own transport or the form's boarding places", async () => {
    await expect(
      submitRegistration(app(), organisationId, campId, { children: [answersOf()], answers: { transport: 'misto-2' } }),
    ).rejects.toMatchObject({
      response: { fields: [{ path: ['registration', 'transport'], code: 'form_answer_invalid' }] },
    });
    await expect(
      submitRegistration(app(), organisationId, campId, { children: [answersOf()], answers: { transport: 'own' } }),
    ).resolves.toMatchObject({ id: expect.any(String) });
  });
});
