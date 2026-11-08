import { beforeEach, describe, expect, it } from 'vitest';

import {
  brandOrganisation,
  createAdmin,
  createCamp,
  createOrganisation,
  submitRegistration,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';

describe('payment reminders', () => {
  const { app, http, clock, database, jobs, mail, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let campId: string;
  let turnusId: string;
  let owner: RequestHeaders;
  let overdueSymbol: string;

  const query = <T>(sql: string, values: unknown[] = []) =>
    withClient(database().ownerUrl, async (client) => (await client.query(sql, values)).rows as T[]);
  const preview = (headers = owner) => http().get(`/api/turnusy/${turnusId}/payment-reminders`).set(headers);
  const send = (overdueOnly: boolean, headers = owner) =>
    http().post(`/api/turnusy/${turnusId}/payment-reminders`).set(headers).send({ overdueOnly });
  const reminders = () => mail().sent.filter(({ subject }) => subject.startsWith('Připomínka platby'));

  beforeEach(async () => {
    organisationId = await createOrganisation(app());
    await brandOrganisation(app(), organisationId, { bankAccount: '19-2000145399/0800' });
    campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');

    // Due in 14 days, so Overdue by the 20th.
    clock().set(new Date('2027-04-01T10:00:00Z'));
    const overdue = await submitRegistration(app(), organisationId, campId, { secondGuardian: true });
    overdueSymbol = overdue.variableSymbol;
    turnusId =
      (await query<{ turnus_id: string }>('SELECT turnus_id FROM registrations WHERE id = $1', [overdue.id]))[0]
        ?.turnus_id ?? '';
    clock().set(new Date('2027-04-20T10:00:00Z'));
    owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    await submitRegistration(app(), organisationId, campId, { turnusId });
    const paid = await submitRegistration(app(), organisationId, campId, { turnusId });
    await http()
      .post(`/api/registrations/${paid.id}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 6500, paidOn: '2027-04-20', note: 'Převodem' });
    const cancelled = await submitRegistration(app(), organisationId, campId, { turnusId });
    await http().post(`/api/registrations/${cancelled.id}/cancel`).set(owner);
    await jobs().drain();
    mail().sent.length = 0;
  });

  it('counts the Registrations with a balance and the Overdue ones, leaving out paid and cancelled', async () => {
    expect((await preview()).body).toEqual({ withBalance: 2, overdue: 1, enabled: true });
  });

  it('emails both guardians of each Registration with a balance, with the payment block, audited', async () => {
    expect((await send(false)).body).toEqual({ reminded: 2 });
    await jobs().drain();

    expect(reminders()).toHaveLength(3);
    const [first] = reminders().filter(({ html }) => html.includes(overdueSymbol));
    expect(first?.html).toContain('cid:');
    expect(first?.attachments.some(({ contentId }) => contentId !== undefined)).toBe(true);
    const audit = await query<{ reminded: string }>(
      `SELECT changes->'reminded'->>'new' AS reminded FROM audit_entries WHERE action = 'payment_reminder.send'`,
    );
    expect(audit).toEqual([{ reminded: '2' }]);
  });

  it('reminds only the Overdue ones when asked', async () => {
    expect((await send(true)).body).toEqual({ reminded: 1 });
    await jobs().drain();

    expect(reminders().map(({ to }) => to)).toEqual([['jana.testovaci@example.com'], ['petr.testovaci@example.com']]);
  });

  it('reminds a partly paid Overdue Registration of what is still due now', async () => {
    const [overdue] = await query<{ id: string }>('SELECT id FROM registrations WHERE variable_symbol = $1', [
      overdueSymbol,
    ]);
    await http()
      .post(`/api/registrations/${overdue?.id}/payments`)
      .set(owner)
      .send({ kind: 'payment', amount: 2000, paidOn: '2027-04-20', note: 'Převodem' });
    mail().sent.length = 0;

    expect((await preview()).body).toEqual({ withBalance: 2, overdue: 1, enabled: true });
    expect((await send(true)).body).toEqual({ reminded: 1 });
    await jobs().drain();

    expect(reminders()[0]?.html).toMatch(/4\s500\sKč/);
  });

  it('sends nothing and says so when the Camp switched the reminder off', async () => {
    await http()
      .put(`/api/camps/${campId}/email-texts/payment_reminder`)
      .set(owner)
      .send({ subject: 'Připomínka platby', text: 'Zaplaťte prosím.', enabled: false });

    expect((await preview()).body.enabled).toBe(false);
    const response = await send(false);
    await jobs().drain();

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('payment_reminder_switched_off');
    expect(reminders()).toEqual([]);
  });

  it('takes Registrations write, and keeps another Organisation away', async () => {
    const otherId = await createOrganisation(app());
    const otherOwner = (await createAdmin(app(), { memberOf: [otherId], owner: true })).headers(otherId);

    await expectPermission(['registrations', 'write'], organisationId, (headers) => send(false, headers));
    await expectPermission(['registrations', 'write'], organisationId, (headers) => preview(headers));
    await expectIsolated(() => send(false, otherOwner));
  });
});

describe('payment reminders, throttled', () => {
  const { app, http, clock, database } = useTestApp({ env: { PAYMENT_REMINDER_LIMIT_PER_ORGANISATION: '1' } });

  it('lets an Organisation send only so many within the window', async () => {
    const organisationId = await createOrganisation(app());
    const campId = await createCamp(app(), organisationId, 'Letní tábor', 'letni-tabor');
    clock().set(new Date('2027-04-01T10:00:00Z'));
    const { id } = await submitRegistration(app(), organisationId, campId);
    const [row] = await withClient(
      database().ownerUrl,
      async (client) =>
        (await client.query('SELECT turnus_id FROM registrations WHERE id = $1', [id])).rows as { turnus_id: string }[],
    );
    const owner = (await createAdmin(app(), { memberOf: [organisationId], owner: true })).headers(organisationId);
    const send = () =>
      http().post(`/api/turnusy/${row?.turnus_id}/payment-reminders`).set(owner).send({ overdueOnly: false });

    expect((await send()).status).toBe(201);
    const throttled = await send();

    expect(throttled.status).toBe(429);
    expect(throttled.body.code).toBe('requests_throttled');
  });
});
