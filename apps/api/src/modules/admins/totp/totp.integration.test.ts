import { describe, expect, it } from 'vitest';

import { runOperatorCommand } from '../../../cli/operator-command.ts';
import { totpCode } from '../../../core/totp/totp.ts';
import { createAdmin, signIn, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { decodeBase32, enrolTotp, withSessionFrom } from '../../../testing/totp.ts';

const THIRTY_SECONDS = 30 * 1000;

describe('TOTP for the Platform operator', () => {
  const { app, http, clock, database } = useTestApp({
    env: { LOGIN_MAX_FAILURES_PER_ACCOUNT: '2', LOGIN_LOCKOUT_MINUTES: '15' },
  });

  const account = async (headers: RequestHeaders) => (await http().get('/api/account').set(headers).expect(200)).body;
  const start = (headers: RequestHeaders) => http().post('/api/account/totp').set(headers);
  const confirm = (headers: RequestHeaders, code: string) =>
    http().post('/api/account/totp/confirm').set(headers).send({ code });
  const verify = (headers: RequestHeaders, code: string) =>
    http().post('/api/sessions/current/totp').set(headers).send({ code });

  const createOperator = async () => {
    const admin = await createAdmin(app(), { memberOf: [] });
    await runOperatorCommand(database().ownerUrl, ['grant', admin.email]);

    return { ...admin, headers: await signIn(app(), admin.id) };
  };

  it('sets up TOTP with a code from the new secret, which passes the session', async () => {
    const operator = await createOperator();

    const started = await start(operator.headers);
    expect(started.status).toBe(201);
    expect(started.body).toEqual({
      secret: expect.stringMatching(/^[A-Z2-7]{32}$/),
      uri: `otpauth://totp/Campie:${encodeURIComponent(operator.email)}?secret=${started.body.secret}&issuer=Campie&algorithm=SHA1&digits=6&period=30`,
    });
    expect(await account(operator.headers)).toMatchObject({ totp: null, secondFactor: false });

    const secret = decodeBase32(started.body.secret);
    const confirmed = await confirm(operator.headers, totpCode(secret, clock().now()));
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.recoveryCodes).toHaveLength(10);

    const passed = withSessionFrom(operator.headers, confirmed);
    expect(await account(passed)).toMatchObject({ operator: true, totp: expect.anything(), secondFactor: true });
    expect((await start(passed)).body).toMatchObject({ code: 'totp_enabled' });
  });

  it('replaces the session that passed a code, so a copy of its cookie from before the code opens nothing', async () => {
    const operator = await createOperator();
    const { secret } = await enrolTotp(http(), operator.headers, clock().now());
    clock().advance(THIRTY_SECONDS);
    const beforeCode = await signIn(app(), operator.id);

    const verified = await verify(beforeCode, totpCode(secret, clock().now()));
    expect(verified.status).toBe(204);

    await http().get('/api/account').set(beforeCode).expect(401);
    await http().get('/api/console/organisations').set(beforeCode).expect(401);
    expect((await http().get('/api/console/organisations').set(withSessionFrom(beforeCode, verified))).status).toBe(
      200,
    );
    await http().get('/api/account').set(operator.headers).expect(401);
  });

  it('stores the secret sealed, never as the app shows it', async () => {
    const operator = await createOperator();
    const { secret } = await enrolTotp(http(), operator.headers, clock().now());

    const [stored] = await withClient(database().ownerUrl, async (client) => {
      const { rows } = await client.query<{ secret: Buffer }>(`SELECT secret FROM totp_credentials`);

      return rows.map((row) => row.secret);
    });

    expect(stored?.includes(secret)).toBe(false);
  });

  it('refuses a wrong code, and a secret replaced by starting again', async () => {
    const operator = await createOperator();
    const first = decodeBase32((await start(operator.headers)).body.secret);
    const second = decodeBase32((await start(operator.headers)).body.secret);

    const wrong = await confirm(operator.headers, totpCode(first, clock().now()));
    expect(wrong.status).toBe(400);
    expect(wrong.body).toMatchObject({ code: 'totp_code_invalid' });
    expect(wrong.headers['set-cookie']).toBeUndefined();
    expect(await account(operator.headers)).toMatchObject({ totp: null, secondFactor: false });

    expect((await confirm(operator.headers, totpCode(second, clock().now()))).status).toBe(200);
  });

  it('passes a later session with a code, each code once', async () => {
    const operator = await createOperator();
    const { secret } = await enrolTotp(http(), operator.headers, clock().now());
    clock().advance(THIRTY_SECONDS);

    const laterSession = await signIn(app(), operator.id);
    expect(await account(laterSession)).toMatchObject({ totp: expect.anything(), secondFactor: false });

    const code = totpCode(secret, clock().now());
    const verified = await verify(laterSession, code);
    expect(verified.status).toBe(204);
    expect(await account(withSessionFrom(laterSession, verified))).toMatchObject({ secondFactor: true });

    const another = await signIn(app(), operator.id);
    expect((await verify(another, code)).body).toMatchObject({ code: 'totp_code_invalid' });
    expect(await account(another)).toMatchObject({ secondFactor: false });

    clock().advance(THIRTY_SECONDS);
    expect((await verify(another, totpCode(secret, clock().now()))).status).toBe(204);
  });

  it('locks the codes out after too many wrong ones, until the lockout period ends', async () => {
    const operator = await createOperator();
    const { secret } = await enrolTotp(http(), operator.headers, clock().now());
    clock().advance(THIRTY_SECONDS);
    const laterSession = await signIn(app(), operator.id);

    for (const _ of [1, 2]) {
      expect((await verify(laterSession, '000000')).body).toMatchObject({ code: 'totp_code_invalid' });
    }

    const locked = await verify(laterSession, totpCode(secret, clock().now()));
    expect(locked.status).toBe(429);
    expect(locked.body).toMatchObject({ code: 'totp_throttled' });

    clock().advance(15 * 60 * 1000);
    expect((await verify(laterSession, totpCode(secret, clock().now()))).status).toBe(204);
  });

  it('refuses steps out of order', async () => {
    const operator = await createOperator();

    expect((await confirm(operator.headers, '123456')).body).toMatchObject({ code: 'totp_not_started' });
    expect((await verify(operator.headers, '123456')).body).toMatchObject({ code: 'totp_not_enabled' });
  });
});
