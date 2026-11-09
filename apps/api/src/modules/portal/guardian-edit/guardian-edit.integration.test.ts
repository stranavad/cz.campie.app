import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  organisationHost,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const JANA = 'jana.testovaci@example.com';
const BUS = '0190a2b4-0000-7000-8000-0000000000b1';
const SHIRT = '0190a2b4-0000-7000-8000-0000000000b2';

const bus = {
  id: BUS,
  type: 'yes_no',
  label: 'Autobus',
  hint: null,
  required: false,
  scope: 'participant',
  health: false,
  surcharge: 300,
  needsVerification: false,
};
const shirt = {
  id: SHIRT,
  type: 'short_text',
  label: 'Tričko',
  hint: null,
  required: false,
  scope: 'participant',
  health: false,
};

describe('guardian edits in the portal', () => {
  const { app, http, clock, database, jobs, mail } = useTestApp();

  let organisationId: string;
  let campId: string;
  let registrationId: string;
  let participantId: string;
  let owner: RequestHeaders;
  let asJana: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const publish = async (custom: object[]) => {
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({ definition: { standard: [], custom }, maxParticipants: 3, declarations: [] });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
  };
  const edit = (headers = asJana) => http().get(`/api/portal/registrations/${registrationId}/edit`).set(headers);
  const answer = (answers: object, headers = asJana) =>
    http()
      .put(`/api/portal/registrations/${registrationId}/answers`)
      .set(headers)
      .send({ registration: {}, participants: [{ participantId, answers }] });
  const tokenFrom = (to: string) =>
    /token=([\w-]+)/.exec(mail().sent.findLast((message) => message.to.includes(to))?.html ?? '')?.[1] ?? '';

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
    participantId = (await query<{ id: string }>('SELECT id FROM participants'))[0]?.id ?? '';
    await jobs().drain();
    mail().sent.length = 0;
    asJana = (await createGuardianSession(app(), organisationId, JANA)).headers;
  });

  it('changes a guardian’s name and phone through the lock date, audited, and nothing after it', async () => {
    await http().patch(`/api/camps/${campId}`).set(owner).send({ contactEditLockDate: '2027-04-11' });
    clock().set(new Date('2027-04-11T21:59:59Z'));
    const change = () =>
      http()
        .patch(`/api/portal/registrations/${registrationId}/guardians/1`)
        .set(asJana)
        .send({ firstName: 'Jana', lastName: 'Nová', phone: '+420 777 888 999' });

    expect((await change()).body.guardians[0]).toMatchObject({ lastName: 'Nová', phone: '+420 777 888 999' });
    expect(
      await query(
        `SELECT changes->'lastName' AS last_name FROM audit_entries WHERE action = 'registration_guardian.update'`,
      ),
    ).toEqual([{ last_name: { old: 'Testovací', new: 'Nová' } }]);

    clock().set(new Date('2027-04-11T22:00:00Z'));
    const refused = await change();
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'registration_locked' });
    expect((await edit()).body.editable).toBe(false);
  });

  it('adds a second guardian once, who gets a login link and has access at once', async () => {
    const add = () =>
      http()
        .post(`/api/portal/registrations/${registrationId}/guardians`)
        .set(asJana)
        .send({ firstName: 'Petr', lastName: 'Testovací', email: 'petr.testovaci@example.com', phone: '' });

    expect((await add()).body.guardians).toMatchObject([{ email: JANA }, { email: 'petr.testovaci@example.com' }]);
    await jobs().drain();
    expect(mail().sent).toMatchObject([{ to: ['petr.testovaci@example.com'] }]);
    expect(tokenFrom('petr.testovaci@example.com')).not.toBe('');

    const asPetr = (await createGuardianSession(app(), organisationId, 'petr.testovaci@example.com')).headers;
    expect((await http().get(`/api/portal/registrations/${registrationId}`).set(asPetr)).status).toBe(200);

    expect((await add()).body).toMatchObject({ code: 'guardian_second_exists' });
    expect(await query(`SELECT action FROM audit_entries WHERE action = 'registration_guardian.create'`)).toHaveLength(
      1,
    );
    expect((await http().delete(`/api/portal/registrations/${registrationId}/guardians/2`).set(asJana)).status).toBe(
      404,
    );
  });

  it('changes an email only once the new address confirms it, and tells the old one', async () => {
    const requested = await http()
      .post(`/api/portal/registrations/${registrationId}/guardians/1/email-change`)
      .set(asJana)
      .send({ email: 'jana.nova@example.com' });
    expect(requested.status).toBe(204);
    await jobs().drain();

    expect((await edit()).body.guardians[0]).toMatchObject({ email: JANA, pendingEmail: 'jana.nova@example.com' });
    const asNew = (await createGuardianSession(app(), organisationId, 'jana.nova@example.com')).headers;
    expect((await edit(asNew)).status).toBe(404);

    const confirmed = await http()
      .post('/api/portal/email-changes/confirm')
      .set({ Host: await organisationHost(app(), organisationId), 'x-csrf-protection': '1' })
      .send({ token: tokenFrom('jana.nova@example.com') });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body).toEqual({ email: 'jana.nova@example.com' });
    await jobs().drain();

    expect((await edit(asNew)).status).toBe(200);
    expect((await edit()).status).toBe(404);
    expect(mail().sent.map(({ to, subject }) => [to, subject])).toEqual([
      [['jana.nova@example.com'], 'Potvrzení nové e-mailové adresy'],
      [[JANA], 'Změna e-mailové adresy u přihlášky'],
    ]);
    expect(mail().sent[1]?.text).toContain('jana.nova@example.com');
    expect(
      await query(
        `SELECT action, actor_identity FROM audit_entries WHERE action LIKE 'registration_guardian.%' ORDER BY id`,
      ),
    ).toEqual([
      { action: 'registration_guardian.request_email_change', actor_identity: JANA },
      { action: 'registration_guardian.update', actor_identity: 'jana.nova@example.com' },
    ]);

    const again = await http()
      .post('/api/portal/email-changes/confirm')
      .set({ Host: await organisationHost(app(), organisationId), 'x-csrf-protection': '1' })
      .send({ token: tokenFrom('jana.nova@example.com') });
    expect(again.status).toBe(400);
    expect(again.body).toMatchObject({ code: 'email_change_invalid' });
    expect(JSON.stringify(again.body)).not.toContain('jana.nova');
  });

  it('refuses an expired link, or one followed on another Organisation, without naming the address', async () => {
    const other = await createOrganisation(app());
    await http()
      .post(`/api/portal/registrations/${registrationId}/guardians/1/email-change`)
      .set(asJana)
      .send({ email: 'jana.nova@example.com' });
    await jobs().drain();
    const confirm = async (host: string) =>
      http()
        .post('/api/portal/email-changes/confirm')
        .set({ Host: host, 'x-csrf-protection': '1' })
        .send({ token: tokenFrom('jana.nova@example.com') });

    const elsewhere = await confirm(await organisationHost(app(), other));
    clock().advance(24 * 60 * 60 * 1000);
    const expired = await confirm(await organisationHost(app(), organisationId));

    for (const refused of [elsewhere, expired]) {
      expect(refused.status).toBe(400);
      expect(refused.body).toMatchObject({ code: 'email_change_invalid' });
      expect(JSON.stringify(refused.body)).not.toContain('jana.nova');
    }
    expect(await query('SELECT email FROM registration_guardians')).toEqual([{ email: JANA }]);
  });

  it('offers fields added later and shows removed ones read-only', async () => {
    await publish([shirt]);
    await answer({ [SHIRT]: 'M' });
    await publish([bus]);

    const { body } = await edit();

    expect(body.newFieldIds).toEqual([BUS]);
    expect(body.removed).toEqual([{ participantId, label: 'Tričko', value: 'M' }]);
  });

  it('prices the first answer to a new surcharge field once, frozen, and refuses changing it', async () => {
    await publish([bus]);

    expect((await answer({ [BUS]: true })).status).toBe(200);
    expect(await query('SELECT kind, label, amount FROM price_lines ORDER BY position')).toEqual([
      { kind: 'base_price', label: null, amount: 6500 },
      { kind: 'paid_extra', label: 'Autobus', amount: 300 },
    ]);
    expect((await http().get(`/api/registrations/${registrationId}/ledger`).set(owner)).body.total).toBe(6800);
    expect((await edit()).body.lockedAnswers).toEqual([{ participantId, fieldId: BUS }]);
    expect(await query(`SELECT action FROM audit_entries WHERE action = 'registration.answer'`)).toHaveLength(1);

    const changed = await answer({ [BUS]: false });
    expect(changed.status).toBe(409);
    expect(changed.body).toMatchObject({ code: 'answer_locked' });
  });

  it("prices each child's first answer on its own, and a per-Registration answer on every child", async () => {
    registrationId = (
      await submitRegistration(app(), organisationId, campId, {
        children: [
          { firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01' },
          { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-09-12' },
        ],
      })
    ).id;
    const [ema, jan] = await query<{ id: string }>(
      'SELECT id FROM participants WHERE registration_id = $1 ORDER BY position',
      [registrationId],
    );
    await publish([bus, { ...bus, id: SHIRT, label: 'Svoz zavazadel', scope: 'registration', surcharge: 100 }]);
    const send = (body: object) =>
      http().put(`/api/portal/registrations/${registrationId}/answers`).set(asJana).send(body);

    expect(
      (await send({ registration: {}, participants: [{ participantId: ema?.id, answers: { [BUS]: true } }] })).status,
    ).toBe(200);
    expect(
      (
        await send({
          registration: { [SHIRT]: true },
          participants: [
            { participantId: ema?.id, answers: { [BUS]: true } },
            { participantId: jan?.id, answers: { [BUS]: false } },
          ],
        })
      ).status,
    ).toBe(200);

    expect(
      await query(
        'SELECT label, amount, participant_id FROM price_lines WHERE registration_id = $1 AND kind = $2 ORDER BY position',
        [registrationId, 'paid_extra'],
      ),
    ).toEqual([
      { label: 'Autobus', amount: 300, participant_id: ema?.id },
      { label: 'Svoz zavazadel', amount: 100, participant_id: ema?.id },
      { label: 'Svoz zavazadel', amount: 100, participant_id: jan?.id },
    ]);
  });

  it('refuses answers to fields the Registration already had or the form does not ask', async () => {
    await publish([bus]);

    const refused = await answer({ firstName: 'Jiná' });

    expect(refused.status).toBe(400);
    expect(refused.body.fields).toEqual([{ path: ['participants', 0, 'firstName'], code: 'form_answer_unknown' }]);
  });

  it("keeps another family's Registration away", async () => {
    const asOther = (await createGuardianSession(app(), organisationId, 'jiny.rodic@example.com')).headers;

    expect((await edit(asOther)).status).toBe(404);
    expect((await answer({}, asOther)).status).toBe(404);
  });
});
