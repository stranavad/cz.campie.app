import { describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { createAdmin, createOrganisation, mainHost, signUpOrganisation } from '../../../testing/fixtures.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { enrolTotp } from '../../../testing/totp.ts';

const OLD_PASSWORD = 'spravne kun baterie sponka';
const NEW_PASSWORD = 'nove heslo pro letni tabor';

describe('admin password reset', () => {
  const { app, http, clock, mail, jobs } = useTestApp({
    env: { LOGIN_MAX_FAILURES_PER_ACCOUNT: '2', LOGIN_LOCKOUT_MINUTES: '15' },
  });

  const post = (path: string, body: object) =>
    http()
      .post(`/api/${path}`)
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send(body);

  const logIn = (email: string, password: string) => post('sessions', { email, password });

  // Asks for a reset and returns the token from the emailed link.
  const requestReset = async (email: string): Promise<string> => {
    expect((await post('password-resets', { email })).status).toBe(204);
    await jobs().drain();
    const link = /https:\/\/app\.campie\.test\/nove-heslo\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '');

    if (link?.[1] === undefined) {
      throw new Error('No reset link was sent');
    }

    return link[1];
  };

  it('emails a link from the auth stream, which sets a new password once', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });

    const token = await requestReset(admin.email.toUpperCase());

    expect(mail().sent).toEqual([
      expect.objectContaining({
        from: '"Campie" <prihlaseni@auth.campie.test>',
        to: [admin.email],
        subject: 'Obnovení hesla do Campie',
      }),
    ]);

    expect((await post('password-resets/complete', { token, password: NEW_PASSWORD })).status).toBe(204);
    expect((await logIn(admin.email, NEW_PASSWORD)).status).toBe(204);
    expect((await logIn(admin.email, OLD_PASSWORD)).status).toBe(401);

    const again = await post('password-resets/complete', { token, password: 'jeste jine heslo na tabor' });
    expect(again.status).toBe(400);
    expect(again.body).toMatchObject({ code: 'password_reset_invalid' });
  });

  it('answers the same for an email without an account, and sends nothing', async () => {
    const response = await post('password-resets', { email: 'nikdo-takovy@example.com' });
    await jobs().drain();

    expect(response.status).toBe(204);
    expect(mail().sent).toEqual([]);
  });

  it('refuses a link after an hour', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });
    const token = await requestReset(admin.email);

    clock().advance(60 * 60 * 1000);
    const response = await post('password-resets/complete', { token, password: NEW_PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'password_reset_invalid' });
    expect((await logIn(admin.email, OLD_PASSWORD)).status).toBe(204);
  });

  it('makes an earlier link stop working once a newer one is sent', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });
    const earlier = await requestReset(admin.email);
    const newer = await requestReset(admin.email);

    const response = await post('password-resets/complete', { token: earlier, password: NEW_PASSWORD });

    expect(response.body).toMatchObject({ statusCode: 400, code: 'password_reset_invalid' });
    expect((await post('password-resets/complete', { token: newer, password: NEW_PASSWORD })).status).toBe(204);
  });

  it('refuses an unknown link', async () => {
    const response = await post('password-resets/complete', { token: 'neplatny-odkaz', password: NEW_PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'password_reset_invalid' });
  });

  it('refuses a weak password, and keeps the link usable', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });
    const token = await requestReset(admin.email);
    const localPart = admin.email.split('@')[0] ?? '';

    const short = await post('password-resets/complete', { token, password: 'kratke' });
    const simple = await post('password-resets/complete', { token, password: '123456789012' });
    const guessable = await post('password-resets/complete', { token, password: `${localPart}-heslo` });

    expect(short.status).toBe(400);
    expect(simple.body).toMatchObject({ statusCode: 400, code: 'password_too_simple' });
    expect(guessable.body).toMatchObject({ statusCode: 400, code: 'password_guessable' });
    expect((await post('password-resets/complete', { token, password: NEW_PASSWORD })).status).toBe(204);
  });

  it('signs the admin out everywhere, and lifts a login lockout', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });
    await logIn(admin.email, 'spatne heslo cislo jedna');
    await logIn(admin.email, 'spatne heslo cislo dva');
    expect((await logIn(admin.email, OLD_PASSWORD)).status).toBe(429);

    const token = await requestReset(admin.email);
    await post('password-resets/complete', { token, password: NEW_PASSWORD });

    const account = await http().get('/api/account').set(admin.headers(''));
    expect(account.status).toBe(401);
    expect((await logIn(admin.email, NEW_PASSWORD)).status).toBe(204);
  });

  // Invites an address to a new Organisation and returns what the invitation page shows for it.
  const lookUpInvitation = async (email: string) => {
    const organisationId = await createOrganisation(app());
    const owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    await http()
      .post('/api/invitations')
      .set(owner.headers(organisationId))
      .send({
        email,
        permissions: { registrations: 'read', campSettings: 'none', health: 'none', oddily: 'none', vedouci: 'none' },
      });
    await jobs().drain();
    const token = /pozvanka\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '')?.[1];

    return (await post('invitations/lookup', { token })).body as { hasAccount: boolean };
  };

  it('verifies the email, and clears TOTP someone else may have enrolled on an account never verified', async () => {
    const planted = await signUpOrganisation(app(), { email: 'jana.testovaci@example.com', password: OLD_PASSWORD });
    await enrolTotp(http(), planted.headers, clock().now());
    expect(await lookUpInvitation('jana.testovaci@example.com')).toMatchObject({ hasAccount: false });

    const token = await requestReset('jana.testovaci@example.com');
    expect((await post('password-resets/complete', { token, password: NEW_PASSWORD })).status).toBe(204);

    const loggedIn = await logIn('jana.testovaci@example.com', NEW_PASSWORD);
    const account = await http()
      .get('/api/account')
      .set({ Host: mainHost(app()), Cookie: String(loggedIn.headers['set-cookie']).split(';')[0] ?? '' });
    expect(account.body).toMatchObject({ totpEnabled: false });
    expect(await lookUpInvitation('jana.testovaci@example.com')).toMatchObject({ hasAccount: true });
  });

  it('keeps the TOTP of a verified account', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });
    await enrolTotp(http(), admin.headers(''), clock().now());

    const token = await requestReset(admin.email);
    await post('password-resets/complete', { token, password: NEW_PASSWORD });

    const loggedIn = await logIn(admin.email, NEW_PASSWORD);
    const headers = { ...admin.headers(''), Cookie: String(loggedIn.headers['set-cookie']).split(';')[0] ?? '' };
    expect((await http().get('/api/account').set(headers)).body).toMatchObject({ totpEnabled: true });
  });
});

describe('admin password reset limits', () => {
  const { app, http, mail, jobs } = useTestApp({
    env: { PASSWORD_RESET_LIMIT_PER_IP: '3', PASSWORD_RESET_LIMIT_PER_EMAIL: '2' },
  });

  const requestReset = (email: string, ipAddress: string) =>
    http()
      .post('/api/password-resets')
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1', 'X-Forwarded-For': ipAddress })
      .send({ email });

  it('sends no more links to one email than its limit, from any address', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });
    expect((await requestReset(admin.email, '198.51.100.7')).status).toBe(204);
    expect((await requestReset(admin.email, '203.0.113.9')).status).toBe(204);

    const refused = await requestReset(admin.email.toUpperCase(), '192.0.2.44');

    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ code: 'requests_throttled' });
    await jobs().drain();
    expect(mail().sent).toHaveLength(2);
  });

  it('refuses an address past its limit across emails, with or without an account alike', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: OLD_PASSWORD });
    await requestReset('nikdo-1@example.com', '198.51.100.7');
    await requestReset('nikdo-2@example.com', '198.51.100.7');
    await requestReset('nikdo-3@example.com', '198.51.100.7');

    expect((await requestReset('nikdo-4@example.com', '198.51.100.7')).status).toBe(429);
    expect((await requestReset(admin.email, '198.51.100.7')).status).toBe(429);
    await jobs().drain();
    expect(mail().sent).toEqual([]);
    expect((await requestReset(admin.email, '203.0.113.9')).status).toBe(204);
  });
});
