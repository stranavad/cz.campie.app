import { describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { SESSION_COOKIES } from '../../../core/sessions/session-cookie.ts';
import { createAdmin, createOrganisation, mainHost } from '../../../testing/fixtures.ts';
import { useTestApp } from '../../../testing/test-app.ts';

const PASSWORD = 'spravne kun baterie sponka';
const LOCKOUT_MS = 15 * 60 * 1000;

describe('admin login', () => {
  const { app, http, clock } = useTestApp({
    env: { LOGIN_MAX_FAILURES_PER_ACCOUNT: '3', LOGIN_MAX_FAILURES_PER_IP: '5', LOGIN_LOCKOUT_MINUTES: '15' },
  });

  const logIn = (email: string, password: string, ipAddress = '203.0.113.10') =>
    http()
      .post('/api/sessions')
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1', 'X-Forwarded-For': ipAddress })
      .send({ email, password });

  const sessionCookie = (response: { headers: Record<string, unknown> }) => {
    const cookies = response.headers['set-cookie'];

    return Array.isArray(cookies)
      ? cookies.map(String).find((cookie) => cookie.startsWith(SESSION_COOKIES.admin))
      : undefined;
  };

  const account = (cookie: string) =>
    http()
      .get('/api/account')
      .set({ Host: mainHost(app()), Cookie: cookie.split(';')[0] ?? '' });

  it('signs an admin in with the right email and password', async () => {
    const admin = await createAdmin(app(), { memberOf: [await createOrganisation(app())], password: PASSWORD });

    const response = await logIn(admin.email.toUpperCase(), PASSWORD);

    expect(response.status).toBe(204);
    const cookie = sessionCookie(response);
    expect(cookie).toMatch(/HttpOnly/);
    expect((await account(cookie ?? '')).body).toMatchObject({ email: admin.email });
  });

  it('refuses a wrong password, an unknown email and an account without a password alike', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const invited = await createAdmin(app(), { memberOf: [] });

    const refusals = [
      await logIn(admin.email, 'jine dlouhe heslo nez to spravne'),
      await logIn('nikdo-takovy@example.com', PASSWORD),
      await logIn(invited.email, PASSWORD),
    ];

    for (const response of refusals) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        code: 'credentials_invalid',
        message: 'Wrong email or password',
      });
      expect(sessionCookie(response)).toBeUndefined();
    }
  });

  it('blocks an account after the configured failures, even with the right password, until the lockout ends', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    for (const ipAddress of ['203.0.113.1', '203.0.113.2', '203.0.113.3']) {
      expect((await logIn(admin.email, 'jine dlouhe heslo nez to spravne', ipAddress)).status).toBe(401);
    }

    const blocked = await logIn(admin.email, PASSWORD, '203.0.113.4');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ code: 'login_throttled' });
    expect(sessionCookie(blocked)).toBeUndefined();

    clock().advance(LOCKOUT_MS - 1000);
    expect((await logIn(admin.email, PASSWORD)).status).toBe(429);

    clock().advance(1000);
    expect((await logIn(admin.email, PASSWORD)).status).toBe(204);
  });

  it('blocks an IP address after the configured failures across accounts, and only that address', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    for (const index of [1, 2, 3, 4, 5]) {
      expect((await logIn(`neznamy-${index}@example.com`, PASSWORD, '198.51.100.7')).status).toBe(401);
    }

    expect((await logIn(admin.email, PASSWORD, '198.51.100.7')).status).toBe(429);
    expect((await logIn(admin.email, PASSWORD, '198.51.100.8')).status).toBe(204);
  });

  it('forgets an account’s failures once it signs in', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const fail = () => logIn(admin.email, 'jine dlouhe heslo nez to spravne');

    await fail();
    await fail();
    expect((await logIn(admin.email, PASSWORD)).status).toBe(204);
    await fail();
    await fail();

    expect((await logIn(admin.email, PASSWORD)).status).toBe(204);
  });

  it('counts simultaneous attempts, so a burst gets no more guesses than the limit', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    const statuses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        logIn(admin.email, `spatne heslo cislo ${index}`, `203.0.113.${20 + index}`),
      ),
    );

    expect(statuses.map((response) => response.status).toSorted((a, b) => a - b)).toEqual([
      401, 401, 401, 429, 429, 429, 429, 429,
    ]);
  });

  it('signs the admin out, ending the session and clearing its cookie', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const cookie = sessionCookie(await logIn(admin.email, PASSWORD)) ?? '';

    const response = await http()
      .delete('/api/sessions/current')
      .set({ Host: mainHost(app()), Cookie: cookie.split(';')[0] ?? '', [ACCESS_HEADERS.csrf]: '1' });

    expect(response.status).toBe(204);
    expect(sessionCookie(response)).toMatch(/^__Host-admin_session=;.*Expires=Thu, 01 Jan 1970/);
    expect((await account(cookie)).status).toBe(401);
  });

  it('clears the cookie of a session that has already ended', async () => {
    const response = await http()
      .delete('/api/sessions/current')
      .set({ Host: mainHost(app()), Cookie: `${SESSION_COOKIES.admin}=ukonceny`, [ACCESS_HEADERS.csrf]: '1' });

    expect(response.status).toBe(204);
    expect(sessionCookie(response)).toMatch(/^__Host-admin_session=;.*Expires=Thu, 01 Jan 1970/);
  });
});
