import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { EMAIL_TYPES, type EmailType } from '@repo/schema/emails';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../core/jobs/job-queue.ts';
import { defineJob, JobHandler } from '../../../core/jobs/job.ts';
import { createAdmin, createCamp, createOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { snapshot } from '../../../testing/tenant-isolation.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { CampEmailService } from './services/camp-email.service.ts';

// Stands in for the features that will send a Camp's emails from a job.
const campEmailJob = defineJob({
  name: 'test.camp-email',
  scope: 'organisation',
  payload: z.object({ campId: z.uuid(), type: z.enum(EMAIL_TYPES) }),
});

@Injectable()
class CampEmailHandler extends JobHandler<typeof campEmailJob> {
  public readonly job = campEmailJob;

  // A test provider sits outside the Camps module, so it looks the service up rather than importing it.
  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  public async handle({ campId, type }: z.output<typeof campEmailJob.payload>): Promise<void> {
    await this.moduleRef.get(CampEmailService, { strict: false }).send(campId, type, {
      values: { deti: 'Ema Testovací', turnus: 'Turnus 1', variabilni_symbol: '27123456' },
      to: ['jana.testovaci@example.com'],
      actionHref: 'https://pokus.campie.test/prihlaseni/abc',
    });
  }
}

const OWN = { subject: 'Máme přihlášku {{deti}}', text: 'Ahoj,\n\ndíky za přihlášku na {{turnus}}.', enabled: true };

type Admin = Awaited<ReturnType<typeof createAdmin>>;

describe('camp emails', () => {
  const { app, http, mail, jobs, database, expectIsolated, expectPermission } = useTestApp({
    providers: [CampEmailHandler],
  });

  let organisationId: string;
  let campId: string;
  let owner: Admin;

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor');
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
  });

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const list = (headers: RequestHeaders) => http().get(`/api/camps/${campId}/email-texts`).set(headers);
  const save = (headers: RequestHeaders, type: string, body: object = OWN) =>
    http().put(`/api/camps/${campId}/email-texts/${type}`).set(headers).send(body);
  const sendNow = async (type: EmailType) => {
    await app()
      .get(UnitOfWork)
      .run(organisationId, async () => app().get(JobQueue).enqueue(campEmailJob, { campId, type }));
    await jobs().drain();
  };

  it('lists every email type with the platform default wording, sent', async () => {
    const response = await list(owner.headers(organisationId));

    expect(response.body.map(({ type }: { type: string }) => type)).toEqual([...EMAIL_TYPES]);
    expect(response.body[0]).toMatchObject({
      type: 'registration_confirmation',
      subject: 'Potvrzení přihlášky na {{tabor}}',
      enabled: true,
      customised: false,
      canSwitchOff: true,
    });
    expect(response.body.find(({ type }: { type: string }) => type === 'login_link')).toMatchObject({
      canSwitchOff: false,
    });
  });

  it("sends a Camp's own wording with placeholders filled, and the defaults again after a reset, audited", async () => {
    expect((await save(owner.headers(organisationId), 'registration_confirmation')).body).toMatchObject({
      ...OWN,
      customised: true,
    });

    await sendNow('registration_confirmation');
    expect(mail().sent).toMatchObject([
      { subject: 'Máme přihlášku Ema Testovací', from: '"Letní tábor" <info@posta.campie.test>' },
    ]);
    expect(mail().sent[0]?.text).toContain('díky za přihlášku na Turnus 1');

    const reset = await http()
      .delete(`/api/camps/${campId}/email-texts/registration_confirmation`)
      .set(owner.headers(organisationId));
    expect(reset.body).toMatchObject({ customised: false, subject: 'Potvrzení přihlášky na {{tabor}}' });
    expect(
      await query('SELECT action FROM audit_entries WHERE action LIKE $1 ORDER BY id', ['camp_email_text.%']),
    ).toEqual([{ action: 'camp_email_text.update' }, { action: 'camp_email_text.remove' }]);
  });

  it('skips an email type the Camp switched off, and sends the others', async () => {
    await save(owner.headers(organisationId), 'cancellation', { ...OWN, enabled: false });

    await sendNow('cancellation');
    await sendNow('registration_confirmation');

    expect(mail().sent.map(({ subject }) => subject)).toEqual(['Potvrzení přihlášky na Letní tábor']);
  });

  it("fills in the Camp's name and contact itself, as the default cancellation text asks", async () => {
    await sendNow('cancellation');

    expect(mail().sent[0]?.text).toContain('napište nám na kontakt-');
    expect(mail().sent[0]?.text).not.toContain('{{');
  });

  it("sends the Camp's team notification to its recipients, and nothing while it names none", async () => {
    await sendNow('new_registration_notification');
    expect(mail().sent).toEqual([]);

    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner.headers(organisationId))
      .send({ notificationEmails: ['hlavni@tabor.example.com'] });
    await sendNow('new_registration_notification');

    expect(mail().sent).toMatchObject([{ to: ['hlavni@tabor.example.com'], subject: 'Nová přihláška na Turnus 1' }]);
  });

  it('keeps a subject on one line', async () => {
    const refused = await save(owner.headers(organisationId), 'cancellation', {
      ...OWN,
      subject: 'Ahoj\nBcc: x@example.com',
    });

    expect(refused.status).toBe(400);
  });

  it('sends the login link from the auth stream and never lets it be switched off', async () => {
    const refused = await save(owner.headers(organisationId), 'login_link', {
      subject: 'Přihlášení do {{tabor}}',
      text: 'Odkaz najdete níže.',
      enabled: false,
    });

    expect(refused.status).toBe(400);
    expect(refused.body).toMatchObject({ code: 'email_type_required' });

    await sendNow('login_link');
    expect(mail().sent).toMatchObject([{ from: '"Letní tábor" <prihlaseni@auth.campie.test>' }]);
  });

  it.each([
    { text: 'Ahoj {{jmeno}}' },
    { text: 'Zbývá zaplatit {{castka}' },
    { text: 'Ahoj {{deti}} {{castka}}' },
    { subject: 'Souhlas za {{castka}}' },
  ])('refuses a subject or text with a placeholder the type does not offer: %o', async (change) => {
    const before = await snapshot(database().ownerUrl);
    const refused = await save(owner.headers(organisationId), 'consent_copy', { ...OWN, ...change });

    expect(refused.status).toBe(400);
    expect(refused.body).toMatchObject({ code: 'email_placeholders_unknown' });
    expect(await snapshot(database().ownerUrl)).toEqual(before);
  });

  it('previews a draft wording with made-up data and the Camp as sender', async () => {
    const response = await http()
      .post(`/api/camps/${campId}/email-texts/registration_confirmation/preview`)
      .set(owner.headers(organisationId))
      .send({ subject: 'Přihláška {{deti}}', text: 'Dobrý den, <b>{{turnus}}</b>' });

    expect(response.status).toBe(200);
    expect(response.body.subject).toBe('Přihláška Ema Testovací, Jan Testovací');
    expect(response.body.html).toContain('Letní tábor');
    expect(response.body.html).toContain('&lt;b&gt;Turnus 1');
    expect(mail().sent).toEqual([]);
  });

  it('stores notification recipients and the contact-edit lock date on the Camp', async () => {
    const updated = await http()
      .patch(`/api/camps/${campId}`)
      .set(owner.headers(organisationId))
      .send({
        notificationEmails: ['Hlavni@Tabor.example.com', 'pokladna@tabor.example.com'],
        contactEditLockDate: '2027-06-20',
      });

    expect(updated.body).toMatchObject({
      notificationEmails: ['hlavni@tabor.example.com', 'pokladna@tabor.example.com'],
      contactEditLockDate: '2027-06-20',
    });
    expect(
      (
        await http()
          .patch(`/api/camps/${campId}`)
          .set(owner.headers(organisationId))
          .send({ notificationEmails: ['neni-email'] })
      ).status,
    ).toBe(400);
  });

  it('takes Camp settings read to see and preview, write to change', async () => {
    await expectPermission(['campSettings', 'read'], organisationId, (headers) => list(headers));
    await expectPermission(['campSettings', 'read'], organisationId, (headers) =>
      http()
        .post(`/api/camps/${campId}/email-texts/cancellation/preview`)
        .set(headers)
        .send({ subject: 'x', text: 'y' }),
    );
    await expectPermission(['campSettings', 'write'], organisationId, (headers) => save(headers, 'cancellation'));
    await expectPermission(['campSettings', 'write'], organisationId, (headers) =>
      http().delete(`/api/camps/${campId}/email-texts/cancellation`).set(headers),
    );
  });

  it("keeps another Organisation's admins away from the Camp's emails", async () => {
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectIsolated(() => list(asOther));
    await expectIsolated(() => save(asOther, 'cancellation'));
    await expectIsolated(() => http().delete(`/api/camps/${campId}/email-texts/cancellation`).set(asOther));
  });
});
