import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { JobQueue } from '../../../core/jobs/job-queue.ts';
import {
  brandOrganisation,
  createAdmin,
  createCamp,
  createOrganisation,
  organisationHost,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { generatePrihlaskyJob } from '../prihlaska/generate-prihlasky.job.ts';

const TURNUS = {
  name: 'Turnus 1',
  startDate: '2027-07-04',
  endDate: '2027-07-17',
  place: 'Pokusov',
  capacity: 40,
  minAge: null,
  maxAge: null,
  opensAt: null,
  closesAt: null,
  closedManually: false,
  websiteUrl: null,
  basePrice: 6500,
  earlyBirdPrice: null,
  earlyBirdLastDay: null,
  deposit: 2000,
  depositDueDays: 14,
  balanceDueDate: '2027-06-15',
};

const SECOND_GUARDIAN = {
  secondGuardianFirstName: 'Petr',
  secondGuardianLastName: 'Testovací',
  secondGuardianEmail: 'petr.testovaci@example.com',
};

describe('registration confirmation', () => {
  const { app, http, clock, database, jobs, mail } = useTestApp();

  let organisationId: string;
  let campId: string;
  let turnusId: string;
  let owner: RequestHeaders;
  let host: string;

  const submit = async (extra: object = SECOND_GUARDIAN) =>
    (
      await http()
        .post('/api/public-camps/letni-tabor/registrations')
        .set({ Host: host, 'x-csrf-protection': '1' })
        .send({
          idempotencyKey: randomUUID(),
          turnusId,
          submission: {
            registration: {
              guardianFirstName: 'Jana',
              guardianLastName: 'Testovací',
              guardianEmail: 'jana.testovaci@example.com',
              guardianPhone: '+420 123 456 789',
              ...extra,
            },
            participants: [
              { firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01' },
              { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-09-12' },
            ],
          },
          paymentChoice: 'deposit',
          discountCode: null,
          // The four mandatory declarations a new Camp's form starts with.
          declarations: [1, 2, 3, 4].map((number) => ({
            id: `00000000-0000-7000-8000-00000000d00${number}`,
            accepted: true,
          })),
        })
    ).body as { id: string; variableSymbol: string };
  const confirmations = () => mail().sent.filter(({ subject }) => subject.startsWith('Potvrzení přihlášky'));

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    await brandOrganisation(app(), organisationId, { bankAccount: '19-2000145399/0800' });
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    host = await organisationHost(app(), organisationId);
    turnusId = (await http().post(`/api/camps/${campId}/turnusy`).set(owner).send(TURNUS)).body.id;
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
    await http()
      .patch(`/api/camps/${campId}`)
      .set(owner)
      .send({ notificationEmails: ['hlavni@tabor.example.com'], contactEmail: 'leto@tabor.example.com' });
  });

  it('sends each guardian one confirmation with every Přihláška attached and the QR platba inline', async () => {
    await submit();
    await jobs().drain();

    expect(confirmations().map(({ to }) => to)).toEqual([
      ['jana.testovaci@example.com'],
      ['petr.testovaci@example.com'],
    ]);
    for (const message of confirmations()) {
      expect(
        message.attachments.map(({ filename, contentType, contentId }) => ({ filename, contentType, contentId })),
      ).toEqual([
        {
          filename: expect.stringMatching(/^prihlaska-\d{8}-1\.pdf$/),
          contentType: 'application/pdf',
          contentId: undefined,
        },
        {
          filename: expect.stringMatching(/^prihlaska-\d{8}-2\.pdf$/),
          contentType: 'application/pdf',
          contentId: undefined,
        },
        { filename: 'qr-platba.png', contentType: 'image/png', contentId: 'qr-platba' },
      ]);
      expect(message.html).toContain('cid:qr-platba');
    }
  });

  it('fills the placeholders with real values and adds the payment block the Camp text does not mention', async () => {
    const { variableSymbol } = await submit();
    await http()
      .put(`/api/camps/${campId}/email-texts/registration_confirmation`)
      .set(owner)
      .send({ subject: 'Přihláška {{deti}}', text: 'Díky za přihlášku na {{turnus}}.', enabled: true });
    await jobs().drain();

    const own = mail().sent.find(({ subject }) => subject === 'Přihláška Ema Testovací, Jan Testovací');
    expect(own?.text).toContain('Díky za přihlášku na Turnus 1.');
    expect(own?.text).toContain(variableSymbol);
    expect(own?.text).toContain('19-2000145399/0800');
    expect(own?.text).toMatch(/Záloha k úhradě\s+4\s000\sKč/u);
    expect(own?.text).toContain('Splatnost 24. 4. 2027');
    expect(own?.text).toContain('Doplatek: 9 000 Kč, splatnost 15. 6. 2027');
    expect(own?.text).toContain('Nebo vše najednou: 13 000 Kč');
  });

  it('fills the default text with the amount due now, its date and the Variable symbol', async () => {
    const { variableSymbol } = await submit({});
    await jobs().drain();

    expect(confirmations()).toHaveLength(1);
    expect(confirmations()[0]?.text).toContain(
      `Prosíme o úhradu 4 000 Kč do 24. 4. 2027 s variabilním symbolem ${variableSymbol}.`,
    );
  });

  it("sends from the Camp's name, replying to its contact", async () => {
    await submit({});
    await jobs().drain();

    expect(confirmations()[0]).toMatchObject({
      from: '"Letní tábor" <info@posta.campie.test>',
      replyTo: 'leto@tabor.example.com',
    });
  });

  it('sends no guardian anything when the Camp switched the confirmation off, but still tells the team', async () => {
    await http()
      .put(`/api/camps/${campId}/email-texts/registration_confirmation`)
      .set(owner)
      .send({ subject: 'Potvrzení přihlášky na {{tabor}}', text: 'Díky.', enabled: false });

    await submit();
    await jobs().drain();

    expect(mail().sent.map(({ to }) => to)).toEqual([['hlavni@tabor.example.com']]);
  });

  it('sends no second confirmation when the Přihláška job runs again after it succeeded', async () => {
    const { id } = await submit({});
    await jobs().drain();

    await app()
      .get(UnitOfWork)
      .run(organisationId, async () =>
        app().get(JobQueue).enqueue(generatePrihlaskyJob, { registrationId: id, sendConfirmation: true }),
      );
    await jobs().drain();

    expect(confirmations()).toHaveLength(1);
  });

  it('sends nothing for a suspended Organisation', async () => {
    await submit();
    await withClient(database().ownerUrl, (client) =>
      client.query("UPDATE organisations SET status = 'suspended' WHERE id = $1", [organisationId]),
    );

    await jobs().drain();

    expect(mail().sent).toEqual([]);
  });
});
