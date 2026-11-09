import { Controller, Get } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Permissions } from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { createAdmin, createOrganisation, type RequestHeaders } from '../../../testing/fixtures.ts';
import { withClient } from '../../../testing/services/postgres.ts';
import { snapshot } from '../../../testing/tenant-isolation.ts';
import { useTestApp } from '../../../testing/test-app.ts';

// Stands in for a feature guarded by a permission area.
@Access('admin')
@Controller('test-members')
class RegistrationsController {
  @Get('registrations')
  @Requires('registrations', 'read')
  public list(): void {}
}

const NONE: Permissions = {
  registrations: 'none',
  campSettings: 'none',
  health: 'none',
  oddily: 'none',
  vedouci: 'none',
};

type Admin = Awaited<ReturnType<typeof createAdmin>>;

const byEmail = (emails: readonly string[]) => emails.toSorted((a, b) => a.localeCompare(b));

describe('members', () => {
  const { app, http, mail, jobs, database, expectIsolated, expectPermission } = useTestApp({
    controllers: [RegistrationsController],
  });

  let organisationId: string;
  let owner: Admin;
  let member: Admin;

  beforeEach(async () => {
    organisationId = await createOrganisation(app(), { displayName: 'Tábor Testov' });
    owner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    member = await createAdmin(app(), { memberOf: [organisationId], name: { firstName: 'Eva', lastName: 'Členová' } });
  });

  const memberIdOf = async (admin: Admin): Promise<string> => {
    const listed: { id: string; email: string }[] = (
      await http().get('/api/members').set(owner.headers(organisationId))
    ).body;
    const found = listed.find(({ email }) => email === admin.email);

    if (found === undefined) {
      throw new Error(`${admin.email} is no member`);
    }

    return found.id;
  };

  // Whom the sent mail went to, one message each.
  const recipients = () => byEmail(mail().sent.map(({ to }) => to.join()));

  const update = async (headers: RequestHeaders, admin: Admin, body: object) =>
    http()
      .patch(`/api/members/${await memberIdOf(admin)}`)
      .set(headers)
      .send(body);

  const readRegistrations = async (admin: Admin) =>
    (await http().get('/api/test-members/registrations').set(admin.headers(organisationId))).status;

  it('names each member, and gives null for one who has not given a name', async () => {
    const response = await http().get('/api/members').set(owner.headers(organisationId));

    expect(response.body).toEqual([
      expect.objectContaining({ email: owner.email, firstName: null, lastName: null }),
      expect.objectContaining({ email: member.email, firstName: 'Eva', lastName: 'Členová' }),
    ]);
  });

  it("changes a member's levels from their next request", async () => {
    expect(await readRegistrations(member)).toBe(403);

    const granted = await update(owner.headers(organisationId), member, {
      permissions: { ...NONE, registrations: 'read' },
    });

    expect(granted.status).toBe(200);
    expect(granted.body).toEqual({
      id: expect.any(String),
      email: member.email,
      firstName: 'Eva',
      lastName: 'Členová',
      owner: false,
      permissions: { ...NONE, registrations: 'read' },
      totpEnabled: false,
    });
    expect(await readRegistrations(member)).toBe(200);

    await update(owner.headers(organisationId), member, { permissions: NONE });
    expect(await readRegistrations(member)).toBe(403);
  });

  it('refuses a change that names nothing, and records no audit entry for one that changes nothing', async () => {
    const empty = await update(owner.headers(organisationId), member, {});
    const same = await update(owner.headers(organisationId), member, { owner: false, permissions: NONE });

    expect(empty.status).toBe(400);
    expect(same.status).toBe(200);
    expect(
      await withClient(
        database().ownerUrl,
        async (client) => (await client.query('SELECT FROM audit_entries')).rowCount,
      ),
    ).toBe(0);
  });

  it('ends a removed member’s access from their next request', async () => {
    const memberId = await memberIdOf(member);

    const removed = await http().delete(`/api/members/${memberId}`).set(owner.headers(organisationId));

    expect(removed.status).toBe(204);
    expect((await http().get('/api/account').set(member.headers(''))).body).toMatchObject({ memberships: [] });
    expect((await http().get('/api/test-members/registrations').set(member.headers(organisationId))).status).toBe(403);
    expect((await http().get('/api/members').set(owner.headers(organisationId))).body).toEqual([
      expect.objectContaining({ email: owner.email }),
    ]);
  });

  it('promotes a member to Owner and demotes them again, audited and emailed to every Owner', async () => {
    const promoted = await update(owner.headers(organisationId), member, { owner: true });
    expect(promoted.body).toMatchObject({ owner: true });
    await jobs().drain();

    expect((await http().get('/api/members').set(member.headers(organisationId))).status).toBe(200);
    expect(recipients()).toEqual(byEmail([member.email, owner.email]));
    expect(mail().sent[0]).toMatchObject({
      from: '"Campie" <info@posta.campie.test>',
      subject: 'Změna vlastníků organizace Tábor Testov',
      text: expect.stringContaining(`Správce: ${member.email}`),
    });
    expect(mail().sent[0]?.text).toContain('Změna: přidání role vlastníka');
    expect(mail().sent[0]?.text).toContain(`Autor změny: ${owner.email}`);

    mail().sent.length = 0;
    const thirdOwner = await createAdmin(app(), { memberOf: [organisationId], owner: true });
    await update(owner.headers(organisationId), member, { owner: false });
    await jobs().drain();

    expect(recipients()).toEqual(byEmail([member.email, owner.email, thirdOwner.email]));
    expect(mail().sent[0]?.text).toContain('Změna: odebrání role vlastníka');
    expect((await http().get('/api/members').set(member.headers(organisationId))).status).toBe(403);

    const entries = await withClient(
      database().ownerUrl,
      async (client) =>
        (await client.query('SELECT actor_identity, action, changes FROM audit_entries ORDER BY id')).rows,
    );
    expect(entries).toEqual([
      { actor_identity: owner.id, action: 'membership.update', changes: { owner: { old: false, new: true } } },
      { actor_identity: owner.id, action: 'membership.update', changes: { owner: { old: true, new: false } } },
    ]);
  });

  it('emails every Owner, the removed one included, when an Owner is removed', async () => {
    const otherOwner = await createAdmin(app(), { memberOf: [organisationId], owner: true });

    await http()
      .delete(`/api/members/${await memberIdOf(otherOwner)}`)
      .set(owner.headers(organisationId));
    await jobs().drain();

    expect(recipients()).toEqual(byEmail([otherOwner.email, owner.email]));
    expect(mail().sent[0]?.text).toContain('Změna: odebrání ze správy organizace');
  });

  it('refuses to demote or remove the last Owner, changing nothing and emailing nobody', async () => {
    const before = await snapshot(database().ownerUrl);

    const demoted = await update(owner.headers(organisationId), owner, { owner: false });
    const removed = await http()
      .delete(`/api/members/${await memberIdOf(owner)}`)
      .set(owner.headers(organisationId));
    await jobs().drain();

    expect(demoted.body).toMatchObject({ statusCode: 409, code: 'last_owner' });
    expect(removed.body).toMatchObject({ statusCode: 409, code: 'last_owner' });
    expect(await snapshot(database().ownerUrl)).toEqual(before);
    expect(mail().sent).toEqual([]);
  });

  it('lets an Owner step down once another member is an Owner', async () => {
    await update(owner.headers(organisationId), member, { owner: true });

    const response = await update(owner.headers(organisationId), owner, { owner: false });

    expect(response.status).toBe(200);
    expect((await http().get('/api/members').set(owner.headers(organisationId))).status).toBe(403);
  });

  it('lets only Owners list, change and remove members', async () => {
    const memberId = await memberIdOf(member);

    await expectPermission(['owner'], organisationId, (headers) => http().get('/api/members').set(headers));
    await expectPermission(['owner'], organisationId, (headers) =>
      http()
        .patch(`/api/members/${memberId}`)
        .set(headers)
        .send({ permissions: { ...NONE, oddily: 'write' } }),
    );
    await expectPermission(['owner'], organisationId, (headers) =>
      http().delete(`/api/members/${memberId}`).set(headers),
    );
  });

  it("refuses an Owner of another Organisation this Organisation's members", async () => {
    const memberId = await memberIdOf(member);
    const otherOrganisation = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), { memberOf: [otherOrganisation], owner: true });

    await expectIsolated(() =>
      http().patch(`/api/members/${memberId}`).set(otherOwner.headers(otherOrganisation)).send({ owner: true }),
    );
    await expectIsolated(() => http().delete(`/api/members/${memberId}`).set(otherOwner.headers(otherOrganisation)));
    expect((await http().get('/api/members').set(otherOwner.headers(otherOrganisation))).body).toEqual([
      expect.objectContaining({ email: otherOwner.email }),
    ]);
  });

  it('names in each Organisation only its own members, an admin of both in both', async () => {
    const otherOrganisation = await createOrganisation(app());
    const otherOwner = await createAdmin(app(), {
      memberOf: [otherOrganisation],
      owner: true,
      name: { firstName: 'Ota', lastName: 'Jinde' },
    });
    const both = await createAdmin(app(), {
      memberOf: [organisationId, otherOrganisation],
      name: { firstName: 'Běla', lastName: 'Obojí' },
    });

    const here = JSON.stringify((await http().get('/api/members').set(owner.headers(organisationId))).body);
    const there = JSON.stringify((await http().get('/api/members').set(otherOwner.headers(otherOrganisation))).body);

    expect(here).toContain('Členová');
    expect(here).toContain(both.email);
    expect(here).not.toContain('Jinde');
    expect(there).toContain('Jinde');
    expect(there).toContain('Obojí');
    expect(there).not.toContain('Členová');
    expect(there).not.toContain(member.email);
  });
});
