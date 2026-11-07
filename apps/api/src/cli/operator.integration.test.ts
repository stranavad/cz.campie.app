import { describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { createAdmin, mainHost, signIn, type RequestHeaders } from '../testing/fixtures.ts';
import { withClient } from '../testing/services/postgres.ts';
import { useTestApp } from '../testing/test-app.ts';
import { enrolTotp } from '../testing/totp.ts';
import { OperatorCommandError, runOperatorCommand } from './operator-command.ts';

describe('operator command line', () => {
  const { app, http, database, clock, jobs, mail } = useTestApp();

  const signInFromCookie = (cookies: string[] | string | undefined): RequestHeaders => ({
    Host: mainHost(app()),
    Cookie: [cookies ?? []]
      .flat()
      .map((cookie) => cookie.split(';')[0])
      .join('; '),
  });

  const account = async (headers: RequestHeaders) => (await http().get('/api/account').set(headers).expect(200)).body;

  it('makes an existing admin the Platform operator and takes it back', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: 'dlouhe-testovaci-heslo' });
    const headers = await signIn(app(), admin.id);

    expect(await account(headers)).toMatchObject({ operator: false });

    await runOperatorCommand(database().ownerUrl, ['grant', admin.email.toUpperCase()]);
    expect(await account(headers)).toMatchObject({ email: admin.email, operator: true });

    await runOperatorCommand(database().ownerUrl, ['revoke', admin.email]);
    expect(await account(headers)).toMatchObject({ operator: false });
  });

  it('creates a missing account without a password, which the operator sets through a password reset', async () => {
    const post = (path: string, body: object) =>
      http()
        .post(`/api/${path}`)
        .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
        .send(body);

    await runOperatorCommand(database().ownerUrl, ['grant', 'provozovatel@example.com']);

    expect((await post('password-resets', { email: 'provozovatel@example.com' })).status).toBe(204);
    await jobs().drain();
    const token = /nove-heslo\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '')?.[1];
    expect((await post('password-resets/complete', { token, password: 'letni tabor u rybnika' })).status).toBe(204);

    const login = await post('sessions', { email: 'provozovatel@example.com', password: 'letni tabor u rybnika' });
    expect(login.status).toBe(204);
    expect(await account(signInFromCookie(login.headers['set-cookie']))).toMatchObject({
      operator: true,
      totpEnabled: false,
    });
  });

  it('resets the TOTP of an operator who lost their app, ending their sessions', async () => {
    const admin = await createAdmin(app(), { memberOf: [] });
    await runOperatorCommand(database().ownerUrl, ['grant', admin.email]);
    const { headers } = await enrolTotp(http(), await signIn(app(), admin.id), clock().now());
    expect(await account(headers)).toMatchObject({ totpEnabled: true, secondFactor: true });

    await runOperatorCommand(database().ownerUrl, ['reset-totp', admin.email]);

    await http().get('/api/account').set(headers).expect(401);
    expect(await account(await signIn(app(), admin.id))).toMatchObject({ operator: true, totpEnabled: false });
  });

  it('records each change in the platform audit log as the system', async () => {
    const admin = await createAdmin(app(), { memberOf: [] });

    await runOperatorCommand(database().ownerUrl, ['grant', admin.email]);
    await runOperatorCommand(database().ownerUrl, ['reset-totp', admin.email]);
    await runOperatorCommand(database().ownerUrl, ['revoke', admin.email]);

    const entries = await withClient(database().ownerUrl, async (client) => {
      const { rows } = await client.query(
        `SELECT actor_kind, actor_identity, action, target_type, target_id FROM platform_audit_entries ORDER BY id`,
      );

      return rows;
    });

    expect(entries).toEqual(
      ['operator.grant', 'totp.reset', 'operator.revoke'].map((action) => ({
        actor_kind: 'system',
        actor_identity: null,
        action,
        target_type: 'admin',
        target_id: admin.id,
      })),
    );
  });

  it('refuses unknown commands, a revoke of someone who is not the operator, and unknown emails', async () => {
    const admin = await createAdmin(app(), { memberOf: [] });

    await expect(runOperatorCommand(database().ownerUrl, ['promote', admin.email])).rejects.toThrow(
      OperatorCommandError,
    );
    await expect(runOperatorCommand(database().ownerUrl, ['grant', 'not-an-email'])).rejects.toThrow(
      OperatorCommandError,
    );
    await expect(runOperatorCommand(database().ownerUrl, ['revoke', admin.email])).rejects.toThrow(
      OperatorCommandError,
    );
    await expect(runOperatorCommand(database().ownerUrl, ['reset-totp', 'nikdo@example.com'])).rejects.toThrow(
      OperatorCommandError,
    );
  });

  it('is the only way: the API cannot write the operator flag at all', async () => {
    const admin = await createAdmin(app(), { memberOf: [] });

    await withClient(database().appUrl, async (client) => {
      await expect(client.query(`INSERT INTO operators (admin_id) VALUES ($1)`, [admin.id])).rejects.toThrow(
        /permission denied/,
      );
    });

    await runOperatorCommand(database().ownerUrl, ['grant', admin.email]);

    await withClient(database().appUrl, async (client) => {
      await expect(client.query(`DELETE FROM operators`)).rejects.toThrow(/permission denied/);
      await expect(client.query(`UPDATE operators SET admin_id = admin_id`)).rejects.toThrow(/permission denied/);
    });
  });
});
