import { describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { createAdmin, mainHost, signIn, signUpOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { enrolTotp } from '../../../testing/totp.ts';

const PASSWORD = 'spravne kun baterie sponka';
const NEW_EMAIL = 'nova.adresa@example.com';
const DAY = 24 * 60 * 60 * 1000;

describe('admin email change', () => {
  const { app, http, clock, mail, jobs, database } = useTestApp({
    env: { LOGIN_MAX_FAILURES_PER_ACCOUNT: '2', LOGIN_LOCKOUT_MINUTES: '15' },
  });

  const platform = (path: string, body: object) =>
    http()
      .post(`/api/${path}`)
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send(body);
  const requestChange = (headers: RequestHeaders, email: string, currentPassword = PASSWORD) =>
    http().post('/api/email-changes').set(headers).send({ email, currentPassword });
  const confirm = (token: string) => platform('email-changes/confirm', { token });
  const logIn = (email: string, password = PASSWORD) => platform('sessions', { email, password });
  const accountOf = async (headers: RequestHeaders) => (await http().get('/api/account').set(headers)).body;

  // Runs the queued jobs and returns the token of the newest confirmation link mailed to an address.
  const linkTo = async (email: string): Promise<string> => {
    await jobs().drain();
    const token = mail()
      .sent.filter(({ to }) => to.includes(email))
      .map(({ text }) => /https:\/\/app\.campie\.test\/zmena-emailu\?token=([\w-]+)/.exec(text ?? '')?.[1])
      .findLast((found) => found !== undefined);

    if (token === undefined) {
      throw new Error(`No confirmation link was mailed to ${email}`);
    }

    return token;
  };

  const auditEntries = () =>
    withClient(database().ownerUrl, async (client) => ({
      platform: (
        await client.query('SELECT actor_kind, actor_identity, action, target_id, changes FROM platform_audit_entries')
      ).rows,
      organisation: (await client.query('SELECT action FROM audit_entries')).rows,
    }));

  it('changes the email only once the link mailed to the new address is followed, and tells the old one', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    expect((await requestChange(admin.headers(''), NEW_EMAIL.toUpperCase())).status).toBe(204);
    const token = await linkTo(NEW_EMAIL);

    expect(mail().sent).toEqual([
      expect.objectContaining({ from: '"Campie" <prihlaseni@auth.campie.test>', to: [NEW_EMAIL] }),
    ]);
    expect(await accountOf(admin.headers(''))).toMatchObject({ email: admin.email });
    expect((await logIn(NEW_EMAIL)).status).toBe(401);
    expect((await auditEntries()).platform).toEqual([]);

    expect((await confirm(token)).status).toBe(204);

    expect(await accountOf(admin.headers(''))).toMatchObject({ email: NEW_EMAIL, emailVerified: true });
    expect((await logIn(NEW_EMAIL)).status).toBe(204);
    expect((await logIn(admin.email)).status).toBe(401);
    expect(await auditEntries()).toEqual({
      platform: [
        {
          actor_kind: 'admin',
          actor_identity: admin.id,
          action: 'admin.change_email',
          target_id: admin.id,
          changes: expect.objectContaining({ email: { old: admin.email, new: NEW_EMAIL } }),
        },
      ],
      organisation: [],
    });

    mail().sent.length = 0;
    await jobs().drain();
    expect(mail().sent.map(({ to, subject }) => ({ to, subject }))).toEqual([
      { to: [admin.email], subject: 'E-mail vašeho účtu byl změněn' },
    ]);
    expect(mail().sent[0]?.text).not.toContain(NEW_EMAIL);
  });

  it('verifies an email never verified, and ends a reset link mailed to the old address', async () => {
    const owner = await signUpOrganisation(app(), { email: 'jana.testovaci@example.com', password: PASSWORD });
    const { [ACCESS_HEADERS.organisation]: _, ...headers } = owner.headers;
    await jobs().drain();
    await platform('password-resets', { email: 'jana.testovaci@example.com' });
    await jobs().drain();
    const resetToken = /nove-heslo\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '')?.[1] ?? '';

    await requestChange(headers, NEW_EMAIL);
    expect((await confirm(await linkTo(NEW_EMAIL))).status).toBe(204);

    expect(await accountOf(headers)).toMatchObject({ email: NEW_EMAIL, emailVerified: true });
    const reset = await platform('password-resets/complete', {
      token: resetToken,
      password: 'nove heslo na tabor 2027',
    });
    expect(reset.body).toMatchObject({ statusCode: 400, code: 'password_reset_invalid' });
  });

  it('ends a waiting link once the owner takes back an account never verified, or changes the password', async () => {
    const planted = await signUpOrganisation(app(), { email: 'jana.testovaci@example.com', password: PASSWORD });
    const { [ACCESS_HEADERS.organisation]: _, ...plantedHeaders } = planted.headers;
    await requestChange(plantedHeaders, 'utocnik@example.com');
    const plantedLink = await linkTo('utocnik@example.com');
    await platform('password-resets', { email: 'jana.testovaci@example.com' });
    await jobs().drain();
    const resetToken = /nove-heslo\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '')?.[1] ?? '';
    expect(
      (await platform('password-resets/complete', { token: resetToken, password: 'nove heslo na tabor 2027' })).status,
    ).toBe(204);

    expect((await confirm(plantedLink)).body).toMatchObject({ statusCode: 400, code: 'email_change_invalid' });

    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    await requestChange(admin.headers(''), NEW_EMAIL);
    const link = await linkTo(NEW_EMAIL);
    const changed = await http()
      .post('/api/account/password')
      .set(admin.headers(''))
      .send({ currentPassword: PASSWORD, password: 'nove heslo na tabor 2027' });
    expect(changed.status).toBe(204);

    expect((await confirm(link)).body).toMatchObject({ statusCode: 400, code: 'email_change_invalid' });
    expect(await accountOf(admin.headers(''))).toMatchObject({ email: admin.email });
  });

  it('refuses a used, a replaced or an expired link', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    await requestChange(admin.headers(''), 'prvni.adresa@example.com');
    const replaced = await linkTo('prvni.adresa@example.com');
    await requestChange(admin.headers(''), NEW_EMAIL);
    const used = await linkTo(NEW_EMAIL);
    expect((await confirm(replaced)).body).toMatchObject({ statusCode: 400, code: 'email_change_invalid' });
    expect((await confirm(used)).status).toBe(204);
    expect((await confirm(used)).body).toMatchObject({ statusCode: 400, code: 'email_change_invalid' });

    await requestChange(admin.headers(''), 'treti.adresa@example.com');
    const expired = await linkTo('treti.adresa@example.com');
    clock().advance(DAY);
    expect((await confirm(expired)).body).toMatchObject({ statusCode: 400, code: 'email_change_invalid' });
    expect(await accountOf(await signIn(app(), admin.id))).toMatchObject({ email: NEW_EMAIL });
  });

  it("answers alike for another admin's address and sends it nothing, and refuses a link once it is taken", async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const other = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    const taken = await requestChange(admin.headers(''), other.email);
    await jobs().drain();
    expect(mail().sent).toEqual([]);
    const free = await requestChange(admin.headers(''), NEW_EMAIL);
    expect({ status: taken.status, body: taken.body }).toEqual({ status: free.status, body: free.body });
    const token = await linkTo(NEW_EMAIL);
    expect(mail().sent.flatMap(({ to }) => to)).toEqual([NEW_EMAIL]);

    await requestChange(other.headers(''), NEW_EMAIL);
    expect((await confirm(await linkTo(NEW_EMAIL))).status).toBe(204);

    expect((await confirm(token)).body).toMatchObject({ statusCode: 409, code: 'email_taken' });
    expect(await accountOf(admin.headers(''))).toMatchObject({ email: admin.email });
  });

  it('refuses a wrong current password, counted towards the login limit, and its own address', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    expect((await requestChange(admin.headers(''), NEW_EMAIL, 'spatne heslo cislo jedna')).body).toMatchObject({
      statusCode: 400,
      code: 'current_password_invalid',
    });
    expect((await requestChange(admin.headers(''), admin.email)).body).toMatchObject({
      statusCode: 400,
      code: 'email_unchanged',
    });
    expect((await logIn(admin.email, 'spatne heslo cislo dva')).status).toBe(401);
    expect((await requestChange(admin.headers(''), NEW_EMAIL)).body).toMatchObject({
      statusCode: 429,
      code: 'login_throttled',
    });

    await jobs().drain();
    expect(mail().sent).toEqual([]);
  });

  it('needs a session that passed two-step login when it is on', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const { headers } = await enrolTotp(http(), admin.headers(''), clock().now());

    const refused = await requestChange(await signIn(app(), admin.id), NEW_EMAIL);

    expect(refused.body).toMatchObject({ statusCode: 403, code: 'second_factor_required' });
    expect((await requestChange(headers, NEW_EMAIL)).status).toBe(204);
  });
});

describe('admin email change limits', () => {
  const { app, http } = useTestApp({ env: { PASSWORD_RESET_LIMIT_PER_EMAIL: '1' } });

  it('mails one new address no more links than its limit', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const request = () =>
      http().post('/api/email-changes').set(admin.headers('')).send({ email: NEW_EMAIL, currentPassword: PASSWORD });

    expect((await request()).status).toBe(204);
    expect((await request()).body).toMatchObject({ statusCode: 429, code: 'requests_throttled' });
  });
});
