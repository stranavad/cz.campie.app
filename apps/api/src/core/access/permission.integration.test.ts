import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MembershipRepository } from '../../repositories/admins/membership/membership.repository.ts';
import { bootApp, restoreEnv } from '../../testing/boot-app.ts';
import { createAdmin, createOrganisation } from '../../testing/fixtures.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { UnitOfWork } from '../database/unit-of-work.ts';
import { Access } from './access.decorator.ts';
import { allows, Requires, type MemberAccess } from './permission.ts';
import { RequestMember } from './request-actor.decorator.ts';

// Stands in for the features behind each permission area.
@Access('admin')
@Controller('test-permissions')
class PermissionsController {
  @Get('registrations')
  @Requires('registrations', 'read')
  public listRegistrations(): void {}

  @Post('registrations')
  @HttpCode(204)
  @Requires('registrations', 'write')
  public changeRegistration(): void {}

  @Get('settings')
  @Requires('owner')
  public readSettings(): void {}

  // Shows health data only to a member with Health read, as every route holding it must.
  @Get('participant')
  @Requires('member')
  public readParticipant(@RequestMember() member: MemberAccess): { name: string; allergies?: string } {
    return {
      name: 'Testovací Dítě',
      ...(allows(member, { area: 'health', level: 'read' }) ? { allergies: 'pyl' } : {}),
    };
  }
}

describe('permissions', () => {
  const { app, http, expectPermission } = useTestApp({ controllers: [PermissionsController] });

  let organisationA: string;
  let organisationB: string;

  beforeEach(async () => {
    organisationA = await createOrganisation(app());
    organisationB = await createOrganisation(app());
  });

  it('admits a Registrations read route at read and write, and refuses it at none', async () => {
    await expectPermission(['registrations', 'read'], organisationA, (headers) =>
      http().get('/api/test-permissions/registrations').set(headers),
    );
  });

  it('refuses a Registrations write route at read', async () => {
    await expectPermission(['registrations', 'write'], organisationA, (headers) =>
      http().post('/api/test-permissions/registrations').set(headers),
    );
  });

  it('admits an Owner-only route for Owners alone, not for a member with write in every area', async () => {
    await expectPermission(['owner'], organisationA, (headers) =>
      http().get('/api/test-permissions/settings').set(headers),
    );
  });

  it('shows health data only with Health read, and to an Owner', async () => {
    const without = await createAdmin(app(), { memberOf: [organisationA], permissions: { registrations: 'write' } });
    const reader = await createAdmin(app(), { memberOf: [organisationA], permissions: { health: 'read' } });
    const owner = await createAdmin(app(), { memberOf: [organisationA], owner: true });

    const read = async (headers: Record<string, string>) =>
      (await http().get('/api/test-permissions/participant').set(headers)).body;

    expect(await read(without.headers(organisationA))).toEqual({ name: 'Testovací Dítě' });
    expect(await read(reader.headers(organisationA))).toEqual({ name: 'Testovací Dítě', allergies: 'pyl' });
    expect(await read(owner.headers(organisationA))).toEqual({ name: 'Testovací Dítě', allergies: 'pyl' });
  });

  it("grants nothing in Organisation B through Organisation A's membership", async () => {
    const ownerOfA = await createAdmin(app(), { memberOf: [organisationA], owner: true });
    const writerInA = await createAdmin(app(), {
      memberOf: [organisationA],
      permissions: { registrations: 'write' },
    });
    await app()
      .get(UnitOfWork)
      .run(organisationB, () => app().get(MembershipRepository).create({ adminId: writerInA.id, owner: false }));

    const send = (headers: Record<string, string>) => http().get('/api/test-permissions/registrations').set(headers);

    expect((await send(writerInA.headers(organisationA))).status).toBe(200);
    expect((await send(ownerOfA.headers(organisationB))).status).toBe(403);
    expect((await send(writerInA.headers(organisationB))).body).toMatchObject({ code: 'permission_denied' });
  });
});

@Access('admin')
@Controller('test-permissions/undeclared')
class UndeclaredPermissionController {
  @Get()
  public read(): void {}
}

@Access('guardian')
@Controller('test-permissions/guardian')
class GuardianWithPermissionController {
  @Get()
  @Requires('registrations', 'read')
  public read(): void {}
}

describe('permission declarations', () => {
  afterEach(restoreEnv);

  it('refuses to boot with an admin route that declares no permission', async () => {
    await expect(bootApp({ controllers: [UndeclaredPermissionController] })).rejects.toThrow(
      /UndeclaredPermissionController\.read/,
    );
  });

  it('refuses to boot with a permission on a route that checks no membership', async () => {
    await expect(bootApp({ controllers: [GuardianWithPermissionController] })).rejects.toThrow(
      /GuardianWithPermissionController\.read/,
    );
  });
});
