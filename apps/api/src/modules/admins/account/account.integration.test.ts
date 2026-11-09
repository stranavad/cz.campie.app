import { describe, expect, it } from 'vitest';

import { DEFAULT_ACCENT_COLOUR } from '@repo/schema/organisations';
import { ACCESS_HEADERS } from '@repo/schema/shared';

import { createAdmin, createOrganisation, mainHost, signIn, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { enrolTotp } from '../../../testing/totp.ts';

const NAME = { firstName: 'Jana', lastName: 'Testovací' };

describe('account', () => {
  const { app, http, clock, database } = useTestApp();

  const rename = (headers: RequestHeaders, body: object) => http().patch('/api/account').set(headers).send(body);
  const auditEntries = () =>
    withClient(database().ownerUrl, async (client) => ({
      platform: (
        await client.query(
          'SELECT actor_kind, actor_identity, action, target_id, changes FROM platform_audit_entries ORDER BY occurred_at',
        )
      ).rows,
      organisation: (await client.query('SELECT action FROM audit_entries')).rows,
    }));

  it("lists only the signed-in admin's own memberships, with each Organisation's status", async () => {
    const organisationA = await createOrganisation(app(), {
      subdomain: 'tabor-a',
      displayName: 'Tábor A',
      status: 'pending',
    });
    const organisationB = await createOrganisation(app(), { subdomain: 'tabor-b', status: 'pending' });
    const admin = await createAdmin(app(), { memberOf: [organisationA] });
    await createAdmin(app(), { memberOf: [organisationB] });
    const { [ACCESS_HEADERS.organisation]: _, ...headers } = admin.headers(organisationA);

    const response = await http().get('/api/account').set(headers);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      email: expect.stringMatching(/@example\.com$/),
      firstName: null,
      lastName: null,
      emailVerified: true,
      operator: false,
      totp: null,
      secondFactor: false,
      memberships: [
        {
          owner: false,
          permissions: { registrations: 'none', campSettings: 'none', health: 'none', oddily: 'none', vedouci: 'none' },
          organisation: {
            id: organisationA,
            displayName: 'Tábor A',
            subdomain: 'tabor-a',
            status: 'pending',
            totpRequired: false,
            accentColour: DEFAULT_ACCENT_COLOUR,
          },
          support: null,
        },
      ],
    });
  });

  it('answers 401 without a session', async () => {
    expect((await http().get('/api/account').set('Host', mainHost(app()))).status).toBe(401);
  });

  it('renames the admin at once in their account and in the members of each of their Organisations', async () => {
    const organisationA = await createOrganisation(app());
    const organisationB = await createOrganisation(app());
    const admin = await createAdmin(app(), { memberOf: [organisationA, organisationB], owner: true, name: NAME });
    const other = await createAdmin(app(), { memberOf: [organisationA], owner: true, name: NAME });

    const renamed = await rename(admin.headers(''), { firstName: ' Petra ', lastName: 'Nováková' });

    expect(renamed.status).toBe(204);
    expect((await http().get('/api/account').set(admin.headers(''))).body).toMatchObject({
      firstName: 'Petra',
      lastName: 'Nováková',
    });
    for (const organisationId of [organisationA, organisationB]) {
      expect((await http().get('/api/members').set(admin.headers(organisationId))).body).toContainEqual(
        expect.objectContaining({ email: admin.email, firstName: 'Petra', lastName: 'Nováková' }),
      );
    }
    expect((await http().get('/api/account').set(other.headers(''))).body).toMatchObject(NAME);
    expect(await auditEntries()).toEqual({
      platform: [
        {
          actor_kind: 'admin',
          actor_identity: admin.id,
          action: 'admin.rename',
          target_id: admin.id,
          changes: { firstName: { old: 'Jana', new: 'Petra' }, lastName: { old: 'Testovací', new: 'Nováková' } },
        },
      ],
      organisation: [],
    });
  });

  it('refuses a name missing, too long or with invisible characters, changing nothing', async () => {
    const admin = await createAdmin(app(), { memberOf: [], name: NAME });

    const missing = await rename(admin.headers(''), { firstName: '  ', lastName: 'Nováková' });
    const tooLong = await rename(admin.headers(''), { firstName: 'P'.repeat(101), lastName: 'Nováková' });
    const hidden = await rename(admin.headers(''), { firstName: 'Petra\u202E', lastName: 'Nováková' });

    expect(missing.body).toMatchObject({ statusCode: 400, fields: [{ path: ['firstName'], code: 'name_required' }] });
    expect(tooLong.body).toMatchObject({ statusCode: 400, fields: [{ path: ['firstName'], code: 'name_too_long' }] });
    expect(hidden.body).toMatchObject({ statusCode: 400, fields: [{ path: ['firstName'], code: 'name_invalid' }] });
    expect((await http().get('/api/account').set(admin.headers(''))).body).toMatchObject(NAME);
    expect((await auditEntries()).platform).toEqual([]);
  });

  it('refuses every change to a session that has not passed two-step login', async () => {
    const admin = await createAdmin(app(), { memberOf: [], name: NAME });
    await enrolTotp(http(), admin.headers(''), clock().now());

    const refused = await rename(await signIn(app(), admin.id), { firstName: 'Petra', lastName: 'Nováková' });

    expect(refused.status).toBe(403);
    expect(refused.body).toMatchObject({ code: 'second_factor_required' });
  });
});

const PASSWORD = 'spravne kun baterie sponka';
const NEW_PASSWORD = 'nove heslo pro letni tabor';

describe('password change', () => {
  const { app, http, clock, mail, jobs, database } = useTestApp({
    env: { LOGIN_MAX_FAILURES_PER_ACCOUNT: '2', LOGIN_LOCKOUT_MINUTES: '15' },
  });

  const change = (headers: RequestHeaders, currentPassword: string, password = NEW_PASSWORD) =>
    http().post('/api/account/password').set(headers).send({ currentPassword, password });
  const logIn = (email: string, password: string) =>
    http()
      .post('/api/sessions')
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send({ email, password });
  const platformActions = () =>
    withClient(
      database().ownerUrl,
      async (client) =>
        (await client.query('SELECT actor_identity, action, target_id, changes FROM platform_audit_entries')).rows,
    );

  it('changes the password with the current one, ends every other session and emails a notice', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const elsewhere = await signIn(app(), admin.id);

    expect((await change(admin.headers(''), PASSWORD)).status).toBe(204);

    expect((await http().get('/api/account').set(admin.headers(''))).status).toBe(200);
    expect((await http().get('/api/account').set(elsewhere)).status).toBe(401);
    expect((await logIn(admin.email, PASSWORD)).status).toBe(401);
    expect((await logIn(admin.email, NEW_PASSWORD)).status).toBe(204);
    expect(await platformActions()).toEqual([
      { actor_identity: admin.id, action: 'admin.change_password', target_id: admin.id, changes: null },
    ]);
    expect(
      await withClient(database().ownerUrl, async (client) => (await client.query('SELECT FROM audit_entries')).rows),
    ).toEqual([]);
    await jobs().drain();
    expect(mail().sent.map(({ to, subject }) => ({ to, subject }))).toEqual([
      { to: [admin.email], subject: 'Heslo k vašemu účtu bylo změněno' },
    ]);
    expect(mail().sent[0]?.text).not.toContain(NEW_PASSWORD);
  });

  it('refuses a wrong current password and counts it towards the login limit', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });

    const wrong = await change(admin.headers(''), 'spatne heslo cislo jedna');
    expect(wrong.status).toBe(400);
    expect(wrong.body).toMatchObject({ code: 'current_password_invalid' });
    expect((await logIn(admin.email, 'spatne heslo cislo dva')).status).toBe(401);

    const locked = await change(admin.headers(''), PASSWORD);
    expect(locked.status).toBe(429);
    expect(locked.body).toMatchObject({ code: 'login_throttled' });
    expect((await logIn(admin.email, PASSWORD)).status).toBe(429);
    expect((await logIn(admin.email, NEW_PASSWORD)).status).toBe(429);
    expect(await platformActions()).toEqual([]);
  });

  it('refuses an account without a password, and a weak new password, keeping the old one', async () => {
    const invited = await createAdmin(app(), { memberOf: [] });
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const localPart = admin.email.split('@')[0] ?? '';

    expect((await change(invited.headers(''), PASSWORD)).body).toMatchObject({ code: 'current_password_invalid' });
    expect((await change(admin.headers(''), PASSWORD, `${localPart}-heslo`)).body).toMatchObject({
      statusCode: 400,
      code: 'password_guessable',
    });
    expect((await logIn(admin.email, PASSWORD)).status).toBe(204);
  });

  it('needs a session that passed two-step login when it is on', async () => {
    const admin = await createAdmin(app(), { memberOf: [], password: PASSWORD });
    const { headers } = await enrolTotp(http(), admin.headers(''), clock().now());

    const refused = await change(await signIn(app(), admin.id), PASSWORD);
    expect(refused.body).toMatchObject({ statusCode: 403, code: 'second_factor_required' });
    expect((await change(headers, PASSWORD)).status).toBe(204);
  });
});
