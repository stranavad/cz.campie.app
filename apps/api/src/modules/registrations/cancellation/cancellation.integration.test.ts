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

const JANA = 'jana.testovaci@example.com';
const PETR = 'petr.testovaci@example.com';

describe('cancel, access emails and guardians', () => {
  const { app, http, clock, database, jobs, mail, pdfs, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let registrationId: string;
  let turnusId: string;
  let owner: RequestHeaders;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const participantIds = async () =>
    (
      await query<{ id: string }>('SELECT id FROM participants WHERE registration_id = $1 ORDER BY position', [
        registrationId,
      ])
    ).map(({ id }) => id);
  const placesTaken = async () =>
    (await http().get(`/api/camps/${campId}/turnusy`).set(owner)).body.find(({ id }: { id: string }) => id === turnusId)
      .registered;

  beforeEach(async () => {
    clock().set(new Date('2027-04-10T10:00:00Z'));
    organisationId = await createOrganisation(app());
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    registrationId = (
      await submitRegistration(app(), organisationId, campId, {
        secondGuardian: true,
        children: [
          { firstName: 'Ema', lastName: 'Testovací', birthDate: '2016-05-01' },
          { firstName: 'Jan', lastName: 'Testovací', birthDate: '2018-09-12' },
        ],
      })
    ).id;
    turnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [registrationId]))[0]
        ?.turnus_id ?? '';
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('cancels a child: its place frees at once, money stays, both guardians learn the balance', async () => {
    const [ema] = await participantIds();
    const linesBefore = await query('SELECT * FROM price_lines ORDER BY position');
    expect(await placesTaken()).toBe(2);

    const cancelled = await http().post(`/api/registrations/${registrationId}/participants/${ema}/cancel`).set(owner);

    expect(cancelled.body.participants.map(({ status }: { status: string }) => status)).toEqual([
      'cancelled',
      'registered',
    ]);
    expect(await placesTaken()).toBe(1);
    expect(await query('SELECT * FROM price_lines ORDER BY position')).toEqual(linesBefore);
    expect(cancelled.body.ledger.total).toBe(13_000);

    await jobs().drain();
    const notices = mail().sent.filter(({ subject }) => subject === 'Zrušení přihlášky');
    expect(notices.map(({ to }) => to)).toEqual([[JANA], [PETR]]);
    expect(notices[0]?.text).toContain('Ema Testovací');
    expect(notices[0]?.text).toContain('Zbývá zaplatit: 13 000 Kč');
    expect(await query(`SELECT action FROM audit_entries WHERE action = 'participant.cancel'`)).toHaveLength(1);
  });

  it('cancels every child of a Registration at once, and skips the email when switched off', async () => {
    await http()
      .put(`/api/camps/${campId}/email-texts/cancellation`)
      .set(owner)
      .send({ subject: 'Zrušení', text: 'Zrušeno.', enabled: false });

    const cancelled = await http().post(`/api/registrations/${registrationId}/cancel`).set(owner);
    await jobs().drain();

    expect(cancelled.body.participants.map(({ status }: { status: string }) => status)).toEqual([
      'cancelled',
      'cancelled',
    ]);
    expect(await placesTaken()).toBe(0);
    expect(mail().sent).toEqual([]);
  });

  it('gives an access email portal access without any email, and takes it away again', async () => {
    const added = await http()
      .post(`/api/registrations/${registrationId}/access-emails`)
      .set(owner)
      .send({ email: 'Babicka@Example.com' });
    const asGrandma = (await createGuardianSession(app(), organisationId, 'babicka@example.com')).headers;
    const portal = () => http().get(`/api/portal/registrations/${registrationId}`).set(asGrandma);

    expect(added.body.accessEmails).toEqual([
      { id: expect.any(String), email: 'babicka@example.com', undeliverable: false },
    ]);
    expect((await portal()).status).toBe(200);
    await jobs().drain();
    expect(mail().sent).toEqual([]);

    // Seeing is all an access email may do: changing the Registration is the guardians'.
    expect(
      (
        await http()
          .patch(`/api/portal/registrations/${registrationId}/guardians/1`)
          .set(asGrandma)
          .send({ firstName: 'Babička', lastName: 'Testovací', phone: '' })
      ).status,
    ).toBe(404);
    expect(
      (
        await http()
          .post(`/api/portal/registrations/${registrationId}/guardians/1/email-change`)
          .set(asGrandma)
          .send({ email: 'babicka@example.com' })
      ).status,
    ).toBe(404);

    // Cancelling tells the guardians only.
    await http().post(`/api/registrations/${registrationId}/cancel`).set(owner);
    await jobs().drain();
    expect(
      mail()
        .sent.flatMap(({ to }) => to)
        .sort(),
    ).toEqual([JANA, PETR]);

    await http()
      .delete(`/api/registrations/${registrationId}/access-emails/${added.body.accessEmails[0].id}`)
      .set(owner);
    expect((await portal()).status).toBe(404);
  });

  it('removes a guardian, who loses access, but never the last one', async () => {
    const asPetr = (await createGuardianSession(app(), organisationId, PETR)).headers;

    const removed = await http().delete(`/api/registrations/${registrationId}/guardians/1`).set(owner);

    expect(removed.body.guardians).toEqual([expect.objectContaining({ position: 1, email: PETR })]);
    expect((await http().get(`/api/portal/registrations/${registrationId}`).set(asPetr)).status).toBe(200);
    const asJana = (await createGuardianSession(app(), organisationId, JANA)).headers;
    expect((await http().get(`/api/portal/registrations/${registrationId}`).set(asJana)).status).toBe(404);

    const last = await http().delete(`/api/registrations/${registrationId}/guardians/1`).set(owner);
    expect(last.status).toBe(409);
    expect(last.body).toMatchObject({ code: 'guardian_last' });
    expect(await query(`SELECT actor_kind FROM audit_entries WHERE action = 'registration_guardian.remove'`)).toEqual([
      { actor_kind: 'admin' },
    ]);
  });

  it("drops a removed guardian's waiting email change, so its link cannot take the other guardian's place", async () => {
    const asJana = (await createGuardianSession(app(), organisationId, JANA)).headers;
    await http()
      .post(`/api/portal/registrations/${registrationId}/guardians/1/email-change`)
      .set(asJana)
      .send({ email: 'jana.nova@example.com' });
    await jobs().drain();
    const token = /token=([\w-]+)/.exec(mail().sent.at(-1)?.html ?? '')?.[1] ?? '';

    await http().delete(`/api/registrations/${registrationId}/guardians/1`).set(owner);
    const confirmed = await http()
      .post('/api/portal/email-changes/confirm')
      .set({ Host: asJana.Host ?? '', 'x-csrf-protection': '1' })
      .send({ token });

    expect(confirmed.body).toMatchObject({ code: 'email_change_invalid' });
    expect(
      await query('SELECT email FROM registration_guardians WHERE registration_id = $1', [registrationId]),
    ).toEqual([{ email: PETR }]);
  });

  it("keeps another Organisation's admins away", async () => {
    const [ema] = await participantIds();
    const otherId = await createOrganisation(app());
    const asOther = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectIsolated(() =>
      http().post(`/api/registrations/${registrationId}/participants/${ema}/cancel`).set(asOther),
    );
    await expectIsolated(() => http().post(`/api/registrations/${registrationId}/cancel`).set(asOther));
    await expectIsolated(() => http().delete(`/api/registrations/${registrationId}/guardians/2`).set(asOther));
    await expectIsolated(() =>
      http().post(`/api/registrations/${registrationId}/access-emails`).set(asOther).send({ email: 'x@example.com' }),
    );
  });

  it("regenerates a child's Přihláška from a job, replacing the stored one", async () => {
    const [ema] = await participantIds();
    const [before] = await query<{ file: string }>('SELECT prihlaska_file_id AS file FROM participants WHERE id = $1', [
      ema,
    ]);
    const rendered = pdfs().rendered.length;

    expect(
      (await http().post(`/api/registrations/${registrationId}/participants/${ema}/prihlaska`).set(owner)).status,
    ).toBe(202);
    expect(pdfs().rendered).toHaveLength(rendered);
    await jobs().drain();

    const [after] = await query<{ file: string }>('SELECT prihlaska_file_id AS file FROM participants WHERE id = $1', [
      ema,
    ]);
    expect(pdfs().rendered).toHaveLength(rendered + 1);
    expect(after?.file).not.toBe(before?.file);
    expect(await query('SELECT id FROM files WHERE id = $1', [before?.file])).toEqual([]);
  });

  it('lets no guardian cancel, and takes Registrations write for every change', async () => {
    const [ema] = await participantIds();
    const asJana = (await createGuardianSession(app(), organisationId, JANA)).headers;

    expect((await http().post(`/api/registrations/${registrationId}/cancel`).set(asJana)).status).toBe(404);
    expect((await http().post(`/api/portal/registrations/${registrationId}/cancel`).set(asJana)).status).toBe(404);
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${registrationId}/participants/${ema}/cancel`).set(headers),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${registrationId}/access-emails`).set(headers).send({ email: 'x@example.com' }),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${registrationId}/participants/${ema}/prihlaska`).set(headers),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().post(`/api/registrations/${registrationId}/cancel`).set(headers),
    );
    await expectPermission(['registrations', 'write'], organisationId, (headers) =>
      http().delete(`/api/registrations/${registrationId}/guardians/2`).set(headers),
    );
  });
});
