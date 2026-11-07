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

const RULES = '0190a2b4-0000-7000-8000-0000000000ad';

describe('open-items reminder', () => {
  const { app, http, database, jobs, mail, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let owner: RequestHeaders;
  let turnusId: string;
  let signedRegistration: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const preview = (headers = owner) => http().get(`/api/turnusy/${turnusId}/open-items-reminders`).set(headers);
  const send = (headers = owner) => http().post(`/api/turnusy/${turnusId}/open-items-reminders`).set(headers);
  const reminders = () => mail().sent.filter(({ subject }) => subject.startsWith('Ještě nám chybí'));

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const camp = (await http().get(`/api/camps/${campId}`).set(owner)).body as { modules: object };
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ modules: { ...camp.modules, consents: true } });
    const consent = await http()
      .post(`/api/camps/${campId}/consents`)
      .set(owner)
      .send({
        title: 'Táborový řád',
        introduction: '',
        items: [{ id: RULES, kind: 'must_agree', text: 'Souhlasím.' }],
        withdrawable: false,
        fileId: null,
      });
    const open = await submitRegistration(app(), organisationId, campId, { secondGuardian: true });
    turnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [open.id]))[0]
        ?.turnus_id ?? '';
    signedRegistration = (await submitRegistration(app(), organisationId, campId, { turnusId })).id;
    const [participant] = await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1', [
      signedRegistration,
    ]);
    const guardian = (await createGuardianSession(app(), organisationId, 'jana.testovaci@example.com')).headers;
    await http()
      .post(
        `/api/portal/registrations/${signedRegistration}/participants/${participant?.id}/consents/${consent.body.id}/signatures`,
      )
      .set(guardian)
      .send({
        consentVersionId: consent.body.versions[0].id,
        answers: { [RULES]: true },
        signerName: 'Jana Testovací',
        signerPlace: 'Testov',
      });
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('counts only Registrations with something open besides payment', async () => {
    expect((await preview()).body).toEqual({ registrations: 1, enabled: true });
  });

  it('emails both guardians what is open per child, audited', async () => {
    expect((await send()).body).toEqual({ reminded: 1 });
    await jobs().drain();

    expect(reminders().map(({ to }) => to)).toEqual([['jana.testovaci@example.com'], ['petr.testovaci@example.com']]);
    expect(reminders()[0]?.html).toContain('Podepsat souhlas: Táborový řád');
    expect(reminders()[0]?.html).toContain('Ema Testovací');
    expect(await query(`SELECT FROM audit_entries WHERE action = 'open_items_reminder.send'`)).toHaveLength(1);
  });

  it('sends nothing and says so when the Camp switched it off', async () => {
    await http()
      .put(`/api/camps/${campId}/email-texts/open_items_reminder`)
      .set(owner)
      .send({ subject: 'Ještě nám chybí', text: 'Doplňte prosím.', enabled: false });

    expect((await send()).body.code).toBe('open_items_reminder_switched_off');
    await jobs().drain();
    expect(reminders()).toEqual([]);
  });

  it('takes Registrations write, and keeps another Organisation away', async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['registrations', 'write'], organisationId, (headers) => preview(headers));
    await expectIsolated(() => send(otherOwner));
  });
});
