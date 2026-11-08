import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
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
import { PrihlaskaService } from './services/prihlaska.service.ts';

const TRANSPORT = '0190a2b4-0000-7000-8000-000000000002';
const RULES = '0190a2b4-0000-7000-8000-00000000d101';

const transport = (label: string) => ({
  id: TRANSPORT,
  type: 'single_choice',
  label,
  hint: null,
  required: false,
  scope: 'participant',
  options: [{ id: 'bus', label: 'Autobusem', surcharge: 300, needsVerification: false }],
});

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

describe('Přihláška PDF', () => {
  const { app, http, clock, database, jobs, mail, pdfs, files } = useTestApp();

  let organisationId: string;
  let campId: string;
  let turnusId: string;
  let owner: RequestHeaders;
  let host: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const publish = async (label: string) => {
    await http()
      .put(`/api/camps/${campId}/registration-form/draft`)
      .set(owner)
      .send({
        definition: { standard: [], custom: [transport(label)] },
        maxParticipants: 3,
        declarations: [{ id: RULES, text: 'Souhlasím s táborovým řádem.', mandatory: true, url: null, fileId: null }],
      });
    await http().post(`/api/camps/${campId}/registration-form/versions`).set(owner);
  };
  const submit = async (paymentChoice = 'deposit') =>
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
            },
            participants: [
              { firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01', [TRANSPORT]: 'bus' },
              { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-09-12' },
            ],
          },
          paymentChoice,
          discountCode: null,
          declarations: [{ id: RULES, accepted: true }],
        })
    ).body as { id: string; variableSymbol: string };
  const prihlasky = () =>
    query<{ position: number; prihlaska_file_id: string | null }>(
      'SELECT position, prihlaska_file_id FROM participants ORDER BY position',
    );

  const firstParticipantId = async () => {
    const [participant] = await query<{ id: string }>('SELECT id FROM participants WHERE position = 0');

    if (participant === undefined) {
      throw new Error('No Participant was submitted');
    }

    return participant.id;
  };
  const regenerate = (inOrganisation: string, participantId: string) =>
    app()
      .get(UnitOfWork)
      .run(inOrganisation, () =>
        app()
          .get(PrihlaskaService)
          .regenerate({ kind: 'admin', identity: 'admin-id', ipAddress: '203.0.113.7' }, participantId),
      );

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    await brandOrganisation(app(), organisationId, { bankAccount: '19-2000145399/0800' });
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    host = await organisationHost(app(), organisationId);
    turnusId = (await http().post(`/api/camps/${campId}/turnusy`).set(owner).send(TURNUS)).body.id;
    await publish('Doprava');
  });

  it('stores one encrypted Přihláška per Participant from a job after the submission', async () => {
    await submit();
    expect(await prihlasky()).toEqual([
      { position: 0, prihlaska_file_id: null },
      { position: 1, prihlaska_file_id: null },
    ]);

    await jobs().drain();

    const stored = (await prihlasky()).map(({ prihlaska_file_id }) => `${organisationId}/${prihlaska_file_id}`);
    expect(pdfs().rendered).toHaveLength(2);
    expect([...files().objects.keys()].sort()).toEqual(stored.sort());
    expect([...files().objects.values()].every((bytes) => !bytes.toString('latin1').includes('%PDF'))).toBe(true);
  });

  it('prints the Participant, guardian, frozen price, the Deposit owed first and everything at once, each with its QR platba', async () => {
    const { variableSymbol } = await submit();
    await jobs().drain();

    const ema = pdfs().rendered[0] ?? '';
    expect(ema).toContain('Ema Testovací');
    expect(ema).toContain('Další děti v přihlášce');
    expect(ema).toContain('Jan Testovací');
    expect(ema).toContain('jana.testovaci@example.com');
    expect(ema).toContain('Doprava');
    expect(ema).toContain('Autobusem');
    expect(ema).toContain(variableSymbol);
    expect(ema).toContain('19-2000145399/0800');
    expect(ema).toMatch(/Záloha k úhradě.*4 000 Kč/s);
    expect(ema).toMatch(/Doplatek.*9 300 Kč, splatnost 15\. 6\. 2027/s);
    expect(ema).toMatch(/Nebo vše najednou.*13 300 Kč/s);
    expect(ema).toMatch(/Celkem.*13 300 Kč/s);
    expect(ema.match(/<svg/g)).toHaveLength(2);
    expect(ema).toMatch(/Záloha<\/figcaption>.*Vše najednou<\/figcaption>/s);
    expect(ema).toContain('☑ Souhlasím s táborovým řádem.');
  });

  it('asks for the whole price when paying in full', async () => {
    await submit('full');
    await jobs().drain();

    expect(pdfs().rendered[0]).toMatch(/Částka k úhradě.*13 300 Kč/s);
    expect(pdfs().rendered[0]).not.toContain('Doplatek');
    // The amount due now is all outstanding, so one QR platba says it all.
    expect(pdfs().rendered[0]?.match(/<svg/g)).toHaveLength(1);
    expect(pdfs().rendered[0]).not.toContain('Vše najednou');
  });

  it('labels the answers as the form version the Registration was submitted under did', async () => {
    await submit();
    await publish('Svoz autobusem');

    await jobs().drain();

    expect(pdfs().rendered[0]).toContain('Doprava');
    expect(pdfs().rendered[0]).not.toContain('Svoz autobusem');
  });

  it("shows the Camp's branding over the Organisation's", async () => {
    await http().patch(`/api/camps/${campId}/branding`).set(owner).send({ accentColour: '#0b6e4f' });

    await submit();
    await jobs().drain();

    expect(pdfs().rendered[0]).toContain('#0b6e4f');
    expect(pdfs().rendered[0]).toContain('Testovací spolek');
  });

  it('prints no QR platba while the Organisation has no bank account', async () => {
    await withClient(database().ownerUrl, (client) =>
      client.query('UPDATE organisations SET bank_account = NULL WHERE id = $1', [organisationId]),
    );

    await submit();
    await jobs().drain();

    expect(pdfs().rendered[0]).not.toContain('<svg');
    expect(pdfs().rendered[0]).toContain('Číslo účtu pro platbu pošle pořadatel tábora.');
  });

  it("regenerates one Participant's Přihláška, removing the earlier file, audited", async () => {
    await submit();
    await jobs().drain();
    const [first] = await prihlasky();
    await regenerate(organisationId, await firstParticipantId());
    await jobs().drain();

    const [again] = await prihlasky();
    expect(again?.prihlaska_file_id).not.toBe(first?.prihlaska_file_id);
    expect(await query('SELECT id FROM files WHERE id = $1', [first?.prihlaska_file_id])).toEqual([]);
    expect(
      await query('SELECT actor_kind FROM audit_entries WHERE action = $1 ORDER BY id', [
        'participant.generate_prihlaska',
      ]),
    ).toEqual([{ actor_kind: 'system' }, { actor_kind: 'system' }, { actor_kind: 'admin' }]);
  });

  it("cannot regenerate another Organisation's Přihláška", async () => {
    await submit();
    const otherId = await createOrganisation(app());

    await expect(regenerate(otherId, await firstParticipantId())).rejects.toThrow(NotFoundException);
  });

  it('alerts the Platform operator once an hour, by ids only, when the Přihlášky cannot be made', async () => {
    const alerts = () => mail().sent.filter(({ to }) => to.includes('operator@example.com'));
    pdfs().failing = true;

    const { variableSymbol } = await submit();
    await jobs().drain();
    await submit();
    await jobs().drain();

    expect(alerts().map(({ subject }) => subject)).toEqual(['Úloha selhala: registrations.generate-prihlasky']);
    expect(alerts()[0]?.text).toContain(organisationId);
    expect(alerts()[0]?.text).not.toContain('Testovací');
    expect(alerts()[0]?.text).not.toContain(variableSymbol);
    expect(await jobs().failed()).toEqual([
      expect.objectContaining({ job: 'registrations.generate-prihlasky', attemptsMade: 8 }),
      expect.objectContaining({ job: 'registrations.generate-prihlasky', attemptsMade: 8 }),
    ]);

    clock().advance(60 * 60 * 1000);
    await submit();
    await jobs().drain();

    expect(alerts()).toHaveLength(2);
  });
});
