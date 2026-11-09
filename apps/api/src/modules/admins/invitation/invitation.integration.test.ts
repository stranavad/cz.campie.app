import { beforeEach, describe, expect, it } from 'vitest';

import type { Permissions } from '@repo/schema/admins';
import { ACCESS_HEADERS } from '@repo/schema/shared';

import {
  createAdmin,
  createOrganisation,
  mainHost,
  signUpOrganisation,
  type RequestHeaders,
} from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { useTestApp } from '../../../testing/test-app.ts';
import { enrolTotp } from '../../../testing/totp.ts';

const PASSWORD = 'nove heslo pro letni tabor';

// The invitee's name, as the invitation page asks it with a password.
const NAME = { firstName: 'Klára', lastName: 'Pozvaná' };

const LEVELS: Permissions = {
  registrations: 'write',
  campSettings: 'read',
  health: 'none',
  oddily: 'read',
  vedouci: 'none',
};

describe('invitations', () => {
  const { app, http, mail, jobs, clock, database, expectIsolated, expectPermission } = useTestApp();

  let organisationId: string;
  let owner: Awaited<ReturnType<typeof createAdmin>>;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), { displayName: 'Tábor Testov' });
    owner = await createAdmin(app(), {
      memberOf: [organisationId],
      owner: true,
      name: { firstName: 'Jana', lastName: 'Zkušební' },
    });
  });

  const platform = (path: string, body: object) =>
    http()
      .post(`/api/${path}`)
      .set({ Host: mainHost(app()), [ACCESS_HEADERS.csrf]: '1' })
      .send(body);

  const invite = (headers: RequestHeaders, email: string, permissions: Permissions = LEVELS) =>
    http().post('/api/invitations').set(headers).send({ email, permissions });

  // Invites an address as the Owner and returns the token from the emailed link.
  const inviteAndReadLink = async (email: string, permissions: Permissions = LEVELS): Promise<string> => {
    expect((await invite(owner.headers(organisationId), email, permissions)).status).toBe(201);
    await jobs().drain();
    const link = /https:\/\/app\.campie\.test\/pozvanka\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '');

    if (link?.[1] === undefined) {
      throw new Error('No invitation link was sent');
    }

    return link[1];
  };

  const members = async () => (await http().get('/api/members').set(owner.headers(organisationId))).body;

  it('emails a link from the auth stream, with which a new admin sets a password and joins with the chosen levels', async () => {
    const token = await inviteAndReadLink('nova-vedouci@example.com');

    expect(mail().sent).toEqual([
      expect.objectContaining({
        from: '"Campie" <prihlaseni@auth.campie.test>',
        to: ['nova-vedouci@example.com'],
        subject: 'Pozvánka do správy Tábor Testov',
      }),
    ]);

    const preview = await platform('invitations/lookup', { token });
    expect(preview.body).toEqual({
      email: 'nova-vedouci@example.com',
      organisation: { displayName: 'Tábor Testov' },
      invitedBy: { firstName: 'Jana', lastName: 'Zkušební' },
      permissions: LEVELS,
      hasAccount: false,
    });

    const accepted = await platform('invitations/accept', { token, password: PASSWORD, ...NAME });
    expect(accepted.status).toBe(204);

    const [cookie] = String(accepted.headers['set-cookie']).split(';');
    const account = await http()
      .get('/api/account')
      .set({ Host: mainHost(app()), Cookie: cookie });
    expect(account.body).toMatchObject({
      email: 'nova-vedouci@example.com',
      ...NAME,
      memberships: [{ owner: false, organisation: { id: organisationId } }],
    });
    expect(await members()).toContainEqual({
      id: expect.any(String),
      email: 'nova-vedouci@example.com',
      ...NAME,
      owner: false,
      permissions: LEVELS,
      totpEnabled: false,
    });
    expect((await platform('sessions', { email: 'nova-vedouci@example.com', password: PASSWORD })).status).toBe(204);
  });

  it('lets an admin who already has an account join without a new password', async () => {
    const elsewhere = await createOrganisation(app());
    const existing = await createAdmin(app(), {
      memberOf: [elsewhere],
      password: 'puvodni heslo z jineho taboru',
      name: { firstName: 'Petr', lastName: 'Stávající' },
    });
    const token = await inviteAndReadLink(existing.email);

    expect((await platform('invitations/lookup', { token })).body).toMatchObject({ hasAccount: true });

    const accepted = await platform('invitations/accept', { token, ...NAME });
    expect(accepted.status).toBe(204);
    expect(accepted.headers['set-cookie']).toBeUndefined();

    expect((await http().get('/api/members').set(existing.headers(organisationId))).status).toBe(403);
    expect(await members()).toContainEqual(
      expect.objectContaining({ email: existing.email, firstName: 'Petr', lastName: 'Stávající', permissions: LEVELS }),
    );
    expect(
      (await platform('sessions', { email: existing.email, password: 'puvodni heslo z jineho taboru' })).status,
    ).toBe(204);
  });

  it('gives an account whose email was never verified to the invitee, ending its password, sessions and TOTP', async () => {
    const planted = await signUpOrganisation(app(), {
      email: 'nova-vedouci@example.com',
      password: 'heslo toho kdo ucet zalozil',
    });
    const { headers: plantedHeaders } = await enrolTotp(http(), planted.headers, clock().now());
    const token = await inviteAndReadLink('nova-vedouci@example.com');

    expect((await platform('invitations/lookup', { token })).body).toMatchObject({ hasAccount: false });
    expect((await platform('invitations/accept', { token })).body).toMatchObject({ code: 'password_required' });
    expect((await platform('invitations/accept', { token, password: PASSWORD })).body).toMatchObject({
      code: 'name_required',
    });

    const accepted = await platform('invitations/accept', { token, password: PASSWORD, ...NAME });
    expect(accepted.status).toBe(204);
    expect(accepted.headers['set-cookie']).toBeDefined();

    expect((await http().get('/api/account').set(plantedHeaders)).status).toBe(401);
    expect(
      (await platform('sessions', { email: 'nova-vedouci@example.com', password: 'heslo toho kdo ucet zalozil' }))
        .status,
    ).toBe(401);

    const loggedIn = await platform('sessions', { email: 'nova-vedouci@example.com', password: PASSWORD });
    expect(loggedIn.status).toBe(204);
    const invitee = { Host: mainHost(app()), Cookie: String(loggedIn.headers['set-cookie']).split(';')[0] ?? '' };
    expect((await http().get('/api/account').set(invitee)).body).toMatchObject({
      ...NAME,
      totp: null,
      memberships: expect.arrayContaining([
        expect.objectContaining({ owner: true, organisation: expect.objectContaining({ id: planted.organisationId }) }),
        expect.objectContaining({ permissions: LEVELS, organisation: expect.objectContaining({ id: organisationId }) }),
      ]),
    });
    expect(await members()).toContainEqual(
      expect.objectContaining({ email: 'nova-vedouci@example.com', permissions: LEVELS }),
    );
  });

  it('lifts a login lockout someone ran up against the address before the takeover', async () => {
    await signUpOrganisation(app(), { email: 'nova-vedouci@example.com', password: 'heslo toho kdo ucet zalozil' });
    const token = await inviteAndReadLink('nova-vedouci@example.com');

    for (let attempt = 0; attempt < 5; attempt++) {
      await platform('sessions', { email: 'nova-vedouci@example.com', password: 'spatne heslo k ciziho uctu' });
    }
    expect((await platform('sessions', { email: 'nova-vedouci@example.com', password: PASSWORD })).status).toBe(429);

    await platform('invitations/accept', { token, password: PASSWORD, ...NAME });

    expect((await platform('sessions', { email: 'nova-vedouci@example.com', password: PASSWORD })).status).toBe(204);
  });

  it('audits a takeover in the inviting Organisation as the invitee', async () => {
    await signUpOrganisation(app(), { email: 'nova-vedouci@example.com', password: 'heslo toho kdo ucet zalozil' });
    const token = await inviteAndReadLink('nova-vedouci@example.com');
    await platform('invitations/accept', { token, password: PASSWORD, ...NAME });

    const [entries, admins] = await withClient(database().ownerUrl, async (client) => [
      (
        await client.query(
          "SELECT organisation_id, actor_identity, target_id, changes FROM audit_entries WHERE action = 'admin.replace_credentials'",
        )
      ).rows,
      (await client.query("SELECT id FROM admins WHERE email = 'nova-vedouci@example.com'")).rows,
    ]);

    expect(entries).toEqual([
      {
        organisation_id: organisationId,
        actor_identity: admins[0]?.id,
        target_id: admins[0]?.id,
        changes: {
          emailVerifiedAt: { old: null, new: clock().now().toISOString() },
          firstName: { old: null, new: 'Klára' },
          lastName: { old: null, new: 'Pozvaná' },
        },
      },
    ]);
  });

  it('names an inviting Owner who has not given a name by email to Owners, and not at all to the invitee', async () => {
    const unnamed = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    clock().advance(5 * 60 * 1000);
    const sentAt = clock().now().toISOString();

    await invite(unnamed.headers(organisationId), 'nova-vedouci@example.com');

    expect((await http().get('/api/invitations').set(owner.headers(organisationId))).body).toEqual([
      expect.objectContaining({
        sentAt,
        invitedBy: { email: unnamed.email, firstName: null, lastName: null },
      }),
    ]);
    await jobs().drain();
    const token = /pozvanka\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '')?.[1];
    expect((await platform('invitations/lookup', { token })).body).toMatchObject({ invitedBy: null });
  });

  it('asks a new account for a valid name, and keeps the link usable', async () => {
    const token = await inviteAndReadLink('nova-vedouci@example.com');

    const missing = await platform('invitations/accept', { token, password: PASSWORD, firstName: 'Klára' });
    const blank = await platform('invitations/accept', { token, password: PASSWORD, ...NAME, lastName: ' ' });
    const hidden = await platform('invitations/accept', { token, password: PASSWORD, ...NAME, firstName: 'K\u200Bá' });

    expect(missing.body).toMatchObject({ statusCode: 400, code: 'name_required' });
    expect(blank.body).toMatchObject({ statusCode: 400, fields: [{ path: ['lastName'], code: 'name_required' }] });
    expect(hidden.body).toMatchObject({ statusCode: 400, fields: [{ path: ['firstName'], code: 'name_invalid' }] });
    expect((await platform('invitations/accept', { token, password: PASSWORD, ...NAME })).status).toBe(204);
  });

  it('accepts a link once', async () => {
    const token = await inviteAndReadLink('nova-vedouci@example.com');
    await platform('invitations/accept', { token, password: PASSWORD, ...NAME });

    const again = await platform('invitations/accept', { token, password: PASSWORD, ...NAME });

    expect(again.body).toMatchObject({ statusCode: 400, code: 'invitation_invalid' });
    expect((await platform('invitations/lookup', { token })).body).toMatchObject({ code: 'invitation_invalid' });
  });

  it('refuses a link after seven days', async () => {
    const token = await inviteAndReadLink('nova-vedouci@example.com');

    clock().advance(7 * 24 * 60 * 60 * 1000);
    const response = await platform('invitations/accept', { token, password: PASSWORD, ...NAME });

    expect(response.body).toMatchObject({ statusCode: 400, code: 'invitation_invalid' });
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('replaces an earlier invitation of the same address, its levels, its link and when it was sent', async () => {
    const earlier = await inviteAndReadLink('nova-vedouci@example.com');
    const secondOwner = await createAdmin(app(), {
      memberOf: [organisationId],
      owner: true,
      name: { firstName: 'Tomáš', lastName: 'Druhý' },
    });
    clock().advance(60 * 60 * 1000);
    const resentAt = clock().now().toISOString();
    expect(
      (await invite(secondOwner.headers(organisationId), 'nova-vedouci@example.com', { ...LEVELS, health: 'read' }))
        .status,
    ).toBe(201);
    await jobs().drain();
    const newer = /pozvanka\?token=([\w-]+)/.exec(mail().sent.at(-1)?.text ?? '')?.[1];
    expect(mail().sent).toHaveLength(2);

    const listed = await http().get('/api/invitations').set(owner.headers(organisationId));
    expect(listed.body).toEqual([
      {
        id: expect.any(String),
        email: 'nova-vedouci@example.com',
        permissions: { ...LEVELS, health: 'read' },
        sentAt: resentAt,
        expiresAt: expect.any(String),
        invitedBy: { email: secondOwner.email, firstName: 'Tomáš', lastName: 'Druhý' },
      },
    ]);

    expect((await platform('invitations/accept', { token: earlier, password: PASSWORD, ...NAME })).status).toBe(400);
    expect((await platform('invitations/accept', { token: newer, password: PASSWORD, ...NAME })).status).toBe(204);
    expect(await members()).toContainEqual(
      expect.objectContaining({ email: 'nova-vedouci@example.com', permissions: { ...LEVELS, health: 'read' } }),
    );
    expect((await http().get('/api/invitations').set(owner.headers(organisationId))).body).toEqual([]);
  });

  it('makes a revoked invitation’s link stop working, and sends nothing if it was not mailed yet', async () => {
    const token = await inviteAndReadLink('nova-vedouci@example.com');
    const [invitation] = (await http().get('/api/invitations').set(owner.headers(organisationId))).body;

    expect((await http().delete(`/api/invitations/${invitation.id}`).set(owner.headers(organisationId))).status).toBe(
      204,
    );
    expect((await platform('invitations/accept', { token, password: PASSWORD, ...NAME })).status).toBe(400);

    const unsent = await invite(owner.headers(organisationId), 'jina-vedouci@example.com');
    await http().delete(`/api/invitations/${unsent.body.id}`).set(owner.headers(organisationId));
    await jobs().drain();

    expect(mail().sent.map(({ to }) => to)).toEqual([['nova-vedouci@example.com']]);
    expect(await jobs().failed()).toEqual([]);
  });

  it('requires a strong password for a new account, and keeps the link usable', async () => {
    const token = await inviteAndReadLink('nova-vedouci@example.com');

    const missing = await platform('invitations/accept', { token });
    const simple = await platform('invitations/accept', { token, password: '123456789012' });
    const guessable = await platform('invitations/accept', { token, password: 'nova-vedouci-heslo' });

    expect(missing.body).toMatchObject({ statusCode: 400, code: 'password_required' });
    expect(simple.body).toMatchObject({ statusCode: 400, code: 'password_too_simple' });
    expect(guessable.body).toMatchObject({ statusCode: 400, code: 'password_guessable' });
    expect((await platform('invitations/accept', { token, password: PASSWORD, ...NAME })).status).toBe(204);
  });

  it('refuses to invite an address that is already a member', async () => {
    const member = await createAdmin(app(), { memberOf: [organisationId] });

    const response = await invite(owner.headers(organisationId), member.email.toUpperCase());

    expect(response.body).toMatchObject({ statusCode: 409, code: 'already_member' });
    expect((await http().get('/api/invitations').set(owner.headers(organisationId))).body).toEqual([]);
  });

  it('lets only Owners list, create and revoke invitations', async () => {
    await expectPermission(['owner'], organisationId, (headers) => http().get('/api/invitations').set(headers));
    await expectPermission(['owner'], organisationId, (headers) =>
      invite(headers, `nova-${Math.random().toString(36).slice(2)}@example.com`),
    );

    const ids: string[] = [];
    for (const index of [1, 2]) {
      ids.push((await invite(owner.headers(organisationId), `odvolat-${index}@example.com`)).body.id);
    }
    await expectPermission(['owner'], organisationId, (headers) =>
      http()
        .delete(`/api/invitations/${ids.shift() ?? ''}`)
        .set(headers),
    );
  });

  it('refuses an Owner of another Organisation an invitation of this one', async () => {
    const { id } = (await invite(owner.headers(organisationId), 'nova-vedouci@example.com')).body;
    const otherOrganisation = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherOrganisation], owner: true });

    await expectIsolated(() => http().delete(`/api/invitations/${id}`).set(otherOwner.headers(otherOrganisation)));
    expect((await http().get('/api/invitations').set(otherOwner.headers(otherOrganisation))).body).toEqual([]);
  });

  it('audits the invitation as the Owner, and the acceptance as the new admin', async () => {
    await inviteAndReadLink('nova-vedouci@example.com');
    const token = await inviteAndReadLink('nova-vedouci@example.com', { ...LEVELS, health: 'read' });
    await platform('invitations/accept', { token, password: PASSWORD, ...NAME });

    const entries = await withClient(database().ownerUrl, async (client) =>
      (
        await client.query(
          'SELECT actor_identity, action, changes FROM audit_entries WHERE organisation_id = $1 ORDER BY id',
          [organisationId],
        )
      ).rows.map(({ actor_identity, action, changes }) => ({ actor: actor_identity, action, changes })),
    );
    const newAdmin = entries.find(({ action }) => action === 'admin.create')?.actor;

    expect(entries.map(({ actor, action }) => ({ actor, action }))).toEqual([
      { actor: owner.id, action: 'invitation.create' },
      { actor: owner.id, action: 'invitation.update' },
      { actor: newAdmin, action: 'admin.create' },
      { actor: newAdmin, action: 'invitation.accept' },
      { actor: newAdmin, action: 'membership.create' },
    ]);
    expect(newAdmin).not.toBe(owner.id);
    expect(entries[1]?.changes).toEqual({
      permissions: { old: LEVELS, new: { ...LEVELS, health: 'read' } },
      sent: { old: true, new: false },
    });
    expect(JSON.stringify(entries)).not.toMatch(/argon2|password|token/i);
  });
});
