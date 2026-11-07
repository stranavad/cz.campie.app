import { Injectable } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createOrganisation } from '../../testing/fixtures.ts';
import { SampleLoginEmail, SampleNoticeEmail } from '../../testing/sample-emails.tsx';
import { useTestApp } from '../../testing/test-app.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { FileService } from '../files/file.service.ts';
import { JobQueue } from '../jobs/job-queue.ts';
import { defineJob, JobHandler } from '../jobs/job.ts';
import { EmailService, type EmailSender } from './email.service.ts';

// Stands in for the features that will send their emails in a job: the payload names what to send by
// ids only, and the feature knows the recipients and its Camp's name and contact.
const sampleEmailJob = defineJob({
  name: 'test.sample-email',
  scope: 'organisation',
  payload: z.object({ email: z.enum(['login', 'notice']), attachmentIds: z.array(z.uuid()).default([]) }),
});

const GUARDIANS = ['jana.testova@example.test', 'petr.testovy@example.test'];

@Injectable()
class SampleEmailHandler extends JobHandler<typeof sampleEmailJob> {
  public readonly job = sampleEmailJob;
  public sender: EmailSender = { name: 'Letní tábor Pokus', replyTo: 'pokus@tabor.example.test' };
  public text = 'Dobrý den,\nvariabilní symbol: {{ variabilni_symbol }}.\n\nTábor: {{tabor}}';

  constructor(private readonly emails: EmailService) {
    super();
  }

  public async handle({ email, attachmentIds }: z.output<typeof sampleEmailJob.payload>): Promise<void> {
    const options = { to: GUARDIANS, sender: this.sender, attachments: attachmentIds };

    await (email === 'login'
      ? this.emails.send(SampleLoginEmail, { url: 'https://pokus.campie.test/prihlaseni/abc' }, options)
      : this.emails.send(
          SampleNoticeEmail,
          { text: this.text, values: { variabilni_symbol: '26123456', tabor: '<b>Pokus</b>\n\nDruhý' } },
          options,
        ));
  }
}

// An obviously fake Přihláška.
const PDF = Buffer.from('%PDF-1.7\n% fake prihlaska of Testovací Dítě\n%%EOF\n');

describe('emails', () => {
  const { app, mail, jobs } = useTestApp({ providers: [SampleEmailHandler] });

  const requestEmail = (organisationId: string, payload: z.input<typeof sampleEmailJob.payload>) =>
    app()
      .get(UnitOfWork)
      .run(organisationId, async () => app().get(JobQueue).enqueue(sampleEmailJob, payload));

  it("sends mail in a job from the notification stream, with the Camp's name as sender and its contact as reply address", async () => {
    const organisation = await createOrganisation(app(), { accentColour: '#2a6f4e' });

    await requestEmail(organisation, { email: 'notice' });

    expect(mail().sent).toEqual([]);

    await jobs().drain();

    expect(mail().sent).toHaveLength(1);
    const [sent] = mail().sent;
    expect(sent).toMatchObject({
      from: '"Letní tábor Pokus" <info@posta.campie.test>',
      to: GUARDIANS,
      replyTo: 'pokus@tabor.example.test',
      subject: 'Ukázkové oznámení',
      attachments: [],
    });
    expect(sent?.html).toContain('Letní tábor Pokus');
    expect(sent?.html).toContain('#2a6f4e');
    expect(sent?.html).toContain('Platební údaje');
    expect(sent?.text).toContain('variabilní symbol: 26123456.');
    expect(sent?.text).not.toContain('Ukázka oznámení z tábora.');
  });

  it("renders placeholders in the text, their values escaped, and keeps the admin's paragraphs and line breaks", async () => {
    const organisation = await createOrganisation(app());

    await requestEmail(organisation, { email: 'notice' });
    await jobs().drain();

    const html = mail().sent[0]?.html ?? '';
    expect(html).toMatch(/>Dobrý den,<br\/>variabilní symbol: 26123456\.<\/p><p /);
    expect(html).not.toContain('{{');
    // A value is text: its markup is escaped and its blank line starts no paragraph of its own.
    expect(html).toContain('>Tábor: &lt;b&gt;Pokus&lt;/b&gt;\n\nDruhý</p>');
  });

  it('sends login-type mail from the auth stream', async () => {
    const organisation = await createOrganisation(app());

    await requestEmail(organisation, { email: 'login' });
    await jobs().drain();

    expect(mail().sent).toMatchObject([
      { from: '"Letní tábor Pokus" <prihlaseni@auth.campie.test>', subject: 'Přihlášení do portálu' },
    ]);
    expect(mail().sent[0]?.html).toContain('href="https://pokus.campie.test/prihlaseni/abc"');
  });

  it.each([
    ['#ffd60a', 'background-color:#ffd60a', 'color:#000000'],
    ['#1d3557', 'background-color:#1d3557', 'color:#ffffff'],
  ])('puts the button in the accent colour %s with text that reads on it', async (accentColour, background, text) => {
    const organisation = await createOrganisation(app(), { accentColour });

    await requestEmail(organisation, { email: 'login' });
    await jobs().drain();

    const button = /<td style="[^"]*">\s*<a href="https:\/\/pokus[^>]*>/.exec(mail().sent[0]?.html ?? '')?.[0] ?? '';
    expect(button).toContain(background);
    expect(button).toContain(text);
  });

  it('attaches stored files by id, decrypted, under their names', async () => {
    const organisation = await createOrganisation(app());
    const fileId = await app()
      .get(UnitOfWork)
      .run(organisation, () => app().get(FileService).store({ name: 'prihlaska.pdf', bytes: PDF }));

    await requestEmail(organisation, { email: 'notice', attachmentIds: [fileId] });
    await jobs().drain();

    const attachments = mail().sent[0]?.attachments ?? [];
    expect(attachments.map(({ filename, contentType }) => ({ filename, contentType }))).toEqual([
      { filename: 'prihlaska.pdf', contentType: 'application/pdf' },
    ]);
    expect(Buffer.from(attachments[0]?.content ?? []).equals(PDF)).toBe(true);
  });

  it('sends nothing for a suspended Organisation, and does not retry', async () => {
    const organisation = await createOrganisation(app(), { status: 'suspended' });

    await requestEmail(organisation, { email: 'login' });
    await requestEmail(organisation, { email: 'notice' });

    expect(await jobs().drain()).toEqual([
      { job: 'test.sample-email', outcome: 'completed' },
      { job: 'test.sample-email', outcome: 'completed' },
    ]);
    expect(mail().sent).toEqual([]);
  });

  it('quotes the sender name, so a Camp name cannot add an address or a header', async () => {
    const organisation = await createOrganisation(app());
    app().get(SampleEmailHandler).sender = {
      name: 'Tábor "Pokus", z. s.\r\nBcc: someone@example.test <x@example.test>',
      replyTo: 'pokus@tabor.example.test',
    };

    await requestEmail(organisation, { email: 'notice' });
    await jobs().drain();

    expect(mail().sent[0]?.from).toBe(
      '"Tábor \\"Pokus\\", z. s. Bcc: someone@example.test <x@example.test>" <info@posta.campie.test>',
    );
  });
});
