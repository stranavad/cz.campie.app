import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { EmailService } from '../../../core/emails/email.service.ts';
import {
  FAKE_SIGNATURE_HEADER,
  signFakeMailNotification,
} from '../../../core/ports/mail-sender/fake-mail-notification.ts';
import {
  createAdmin,
  createCamp,
  createGuardianSession,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { createOperator } from '../../../testing/operator.ts';
import { SampleLoginEmail, SampleNoticeEmail } from '../../../testing/sample-emails.tsx';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const GUARDIAN = 'jana.testovaci@example.com';
const SENDER = { name: 'Letní tábor', replyTo: 'tabor@spolek.example.com' };

describe('bounce and complaint notifications', () => {
  const testApp = useTestApp();
  const { app, http, mail, database, expectIsolated, expectPermission } = testApp;

  let organisationId: string;
  let otherOrganisationId: string;
  let admin: RequestHeaders;
  let registrationId: string;

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    otherOrganisationId = await createOrganisation(app());
    admin = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    registrationId = (await submitRegistration(app(), organisationId, campId)).id;
    // The same family registered in another Organisation too.
    await submitRegistration(
      app(),
      otherOrganisationId,
      await createCamp(app(), otherOrganisationId, 'Jiný tábor', 'jiny-tabor'),
    );
  });

  const notify = (body: object, signature?: string) => {
    const raw = JSON.stringify(body);

    return http()
      .post('/api/webhooks/mail')
      .set('content-type', 'application/json')
      .set(FAKE_SIGNATURE_HEADER, signature ?? signFakeMailNotification(raw))
      .send(raw);
  };
  const detail = async () => (await http().get(`/api/registrations/${registrationId}`).set(admin)).body;
  const marks = () =>
    withClient(
      database().ownerUrl,
      async (client) =>
        (
          await client.query<{ organisation_id: string; email: string; reason: string }>(
            'SELECT organisation_id, email, reason FROM undeliverable_emails',
          )
        ).rows,
    );
  const send = (template: typeof SampleLoginEmail | typeof SampleNoticeEmail) =>
    app()
      .get(UnitOfWork)
      .run(organisationId, () =>
        template === SampleLoginEmail
          ? app()
              .get(EmailService)
              .send(
                SampleLoginEmail,
                { url: 'https://example.com/prihlaseni' },
                {
                  to: [GUARDIAN],
                  sender: SENDER,
                },
              )
          : app()
              .get(EmailService)
              .send(
                SampleNoticeEmail,
                { text: 'Oznámení', values: {} },
                {
                  to: [GUARDIAN],
                  sender: SENDER,
                },
              ),
      );

  it("marks a hard-bounced address undeliverable in the Organisation's Registrations, the portal and the list", async () => {
    const response = await notify({ reason: 'bounce', organisationId, recipients: ['Jana.Testovaci@Example.com'] });
    expect(response.status).toBe(204);

    expect(await marks()).toEqual([{ organisation_id: organisationId, email: GUARDIAN, reason: 'bounce' }]);
    const shown = await detail();
    expect(shown.guardians).toEqual([expect.objectContaining({ email: GUARDIAN, undeliverable: true })]);

    const list = await http().get(`/api/turnusy/${shown.turnus.id}/participants`).set(admin);
    expect(list.body).toEqual([expect.objectContaining({ registrationId, emailUndeliverable: true })]);

    const guardian = await createGuardianSession(app(), organisationId, GUARDIAN);
    const portal = await http().get('/api/portal/registrations').set(guardian.headers);
    expect(portal.body.registrations).toEqual([expect.objectContaining({ undeliverableEmails: [GUARDIAN] })]);

    const audit = await withClient(
      database().ownerUrl,
      async (client) =>
        (await client.query('SELECT action, actor_kind FROM audit_entries WHERE action LIKE $1', ['undeliverable%']))
          .rows,
    );
    expect(audit).toEqual([{ action: 'undeliverable_email.mark', actor_kind: 'system' }]);
  });

  it('acts on nothing whose signature does not check out', async () => {
    const forged = await notify({ reason: 'complaint', organisationId, recipients: [GUARDIAN] }, 'a'.repeat(64));
    const unsigned = await http()
      .post('/api/webhooks/mail')
      .set('content-type', 'application/json')
      .send({ reason: 'complaint', organisationId, recipients: [GUARDIAN] });

    expect(forged.status).toBe(401);
    expect(unsigned.status).toBe(401);
    expect(await marks()).toEqual([]);
  });

  it('skips notifications to the address and counts them, but still sends login links', async () => {
    await notify({ reason: 'complaint', organisationId, recipients: [GUARDIAN] });
    mail().sent.length = 0;

    await send(SampleNoticeEmail);
    await send(SampleLoginEmail);

    expect(mail().sent.map(({ subject }) => subject)).toEqual(['Přihlášení do portálu']);
    const counts = await withClient(
      database().ownerUrl,
      async (client) =>
        (
          await client.query(
            'SELECT sent, skipped, bounced, complained FROM mail_statistics WHERE organisation_id = $1',
            [organisationId],
          )
        ).rows,
    );
    expect(counts).toEqual([expect.objectContaining({ skipped: 1, complained: 1 })]);
  });

  it("leaves another Organisation's Registrations with the same address alone", async () => {
    await notify({ reason: 'bounce', organisationId, recipients: [GUARDIAN] });

    const guardian = await createGuardianSession(app(), otherOrganisationId, GUARDIAN);
    const portal = await http().get('/api/portal/registrations').set(guardian.headers);

    expect(portal.body.registrations).toEqual([expect.objectContaining({ undeliverableEmails: [] })]);
  });

  it("clears the mark of an address an admin changes the guardian's email to, not of one saved unchanged", async () => {
    const corrected = 'jana.opravena@example.com';
    await notify({ reason: 'bounce', organisationId, recipients: [GUARDIAN] });
    await notify({ reason: 'bounce', organisationId, recipients: [corrected] });
    const save = (email: string) =>
      http()
        .put(`/api/registrations/${registrationId}/guardians/1`)
        .set(admin)
        .send({ firstName: 'Jana', lastName: 'Testovací', email, phone: null });

    expect((await save(GUARDIAN)).body.guardians).toEqual([expect.objectContaining({ undeliverable: true })]);

    const changed = await save(corrected);

    expect(changed.status).toBe(200);
    expect(changed.body.guardians).toEqual([expect.objectContaining({ email: corrected, undeliverable: false })]);
    expect((await marks()).map(({ email }) => email)).toEqual([GUARDIAN]);
  });

  it("lets Registrations write clear the mark of the Registration's own addresses only, audited", async () => {
    const grandparent = 'babicka.testovaci@example.com';
    await http().post(`/api/registrations/${registrationId}/access-emails`).set(admin).send({ email: grandparent });
    await notify({ reason: 'bounce', organisationId, recipients: [GUARDIAN] });
    await notify({ reason: 'complaint', organisationId, recipients: [grandparent] });
    await notify({ reason: 'bounce', organisationId, recipients: ['cizi.rodic@example.com'] });
    await notify({ reason: 'bounce', organisationId: otherOrganisationId, recipients: [GUARDIAN] });
    const clear = (email: string, headers = admin) =>
      http().post(`/api/registrations/${registrationId}/clear-undeliverable`).set(headers).send({ email });

    expect((await clear('cizi.rodic@example.com')).status).toBe(404);
    const cleared = await clear('Jana.Testovaci@Example.com');

    expect(cleared.status).toBe(200);
    expect(cleared.body.guardians).toEqual([expect.objectContaining({ email: GUARDIAN, undeliverable: false })]);
    expect((await clear(grandparent)).body.accessEmails).toEqual([
      expect.objectContaining({ email: grandparent, undeliverable: false }),
    ]);
    expect((await marks()).map(({ organisation_id, email }) => [organisation_id === organisationId, email])).toEqual([
      [true, 'cizi.rodic@example.com'],
      [false, GUARDIAN],
    ]);
    const audit = await withClient(
      database().ownerUrl,
      async (client) =>
        (
          await client.query(
            `SELECT actor_kind, changes->'email'->>'old' AS email FROM audit_entries
              WHERE action = 'undeliverable_email.clear' ORDER BY occurred_at, id`,
          )
        ).rows,
    );
    expect(audit).toEqual([
      { actor_kind: 'admin', email: GUARDIAN },
      { actor_kind: 'admin', email: grandparent },
    ]);

    await notify({ reason: 'bounce', organisationId, recipients: [GUARDIAN] });
    await expectPermission(['registrations', 'write'], organisationId, (headers) => clear(GUARDIAN, headers));
    const otherAdmin = (await createAdmin(app(), { memberOf: [otherOrganisationId], owner: true })).headers(
      otherOrganisationId,
    );
    await expectIsolated(() => clear(GUARDIAN, otherAdmin));
  });

  it('ignores an event of no interest, and one for a deleted Organisation', async () => {
    expect((await notify({ reason: 'delivered', organisationId, recipients: [GUARDIAN] })).status).toBe(204);
    expect(
      (
        await notify({
          reason: 'bounce',
          organisationId: '01900000-0000-7000-8000-000000000000',
          recipients: [GUARDIAN],
        })
      ).status,
    ).toBe(204);

    expect(await marks()).toEqual([]);
  });

  it("shows the operator each Organisation's counts, never an address", async () => {
    await send(SampleNoticeEmail);
    await notify({ reason: 'bounce', organisationId, recipients: [GUARDIAN] });
    const operator = await createOperator(testApp);

    const listed = await http().get('/api/console/organisations').set(operator.headers);

    expect(listed.body).toContainEqual(
      expect.objectContaining({ id: organisationId, mail: { sent: 1, bounced: 1, complained: 0 } }),
    );
    expect(JSON.stringify(listed.body)).not.toContain(GUARDIAN);
  });
});
