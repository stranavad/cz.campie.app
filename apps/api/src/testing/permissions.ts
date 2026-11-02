import type { INestApplication } from '@nestjs/common';
import { expect } from 'vitest';

import { levelIncludes, PERMISSION_LEVELS, type PermissionLevel, type Permissions } from '@repo/schema/admins';

import type { Requires } from '../core/access/permission.ts';
import { createAdmin, type RequestHeaders } from './fixtures.ts';
import { snapshot } from './tenant-isolation.ts';

// What a route declares with @Requires, in the same words.
export type Requirement = Parameters<typeof Requires>;

// Sends the route's request with the given admin's headers.
export type PermissionAttempt = (headers: RequestHeaders) => PromiseLike<{ status: number; body: unknown }>;

interface Member {
  readonly label: string;
  readonly owner: boolean;
  readonly permissions: Permissions;
  readonly admitted: boolean;
}

/**
 * Every area at one level, so a member differs from another only where a test says.
 * @param level the level of every area
 */
function everyArea(level: PermissionLevel): Permissions {
  return { registrations: level, campSettings: level, health: level, oddily: level, vedouci: level };
}

/**
 * The members a requirement must tell apart, each with whether the route admits them.
 * @param requirement what the route declares
 */
function membersFor(requirement: Requirement): Member[] {
  const owner: Member = { label: 'an Owner', owner: true, permissions: everyArea('none'), admitted: true };

  if (requirement.length === 2) {
    const [area, needed] = requirement;

    // Every other area at write, so only the required area decides.
    return [
      ...PERMISSION_LEVELS.map((level) => ({
        label: `${area} at ${level}`,
        owner: false,
        permissions: { ...everyArea('write'), [area]: level },
        admitted: levelIncludes(level, needed),
      })),
      owner,
    ];
  }

  if (requirement[0] === 'owner') {
    return [
      { label: 'a member with write in every area', owner: false, permissions: everyArea('write'), admitted: false },
      owner,
    ];
  }

  return [{ label: 'a member with none in every area', owner: false, permissions: everyArea('none'), admitted: true }];
}

/**
 * Assert that a route refuses every member below its requirement with 403 permission_denied, changing
 * nothing, and admits every member who meets it: for an area, that area at none, read and write with every
 * other area at write, and an Owner.
 * @param app the running test app
 * @param ownerUrl the test's database, as its owner
 * @param requirement what the route declares with @Requires
 * @param organisationId the Organisation the members belong to and the request acts in
 * @param attempt sends the route's request with a member's headers; may run once per member
 */
export async function expectPermission(
  app: INestApplication,
  ownerUrl: string,
  requirement: Requirement,
  organisationId: string,
  attempt: PermissionAttempt,
): Promise<void> {
  const members = await Promise.all(
    membersFor(requirement).map(async (member) => {
      const { owner, permissions } = member;
      const admin = await createAdmin(app, { memberOf: [organisationId], owner, permissions });

      return { ...member, headers: admin.headers(organisationId) };
    }),
  );

  const before = await snapshot(ownerUrl);

  for (const member of members.filter(({ admitted }) => !admitted)) {
    const { status, body } = await attempt(member.headers);

    expect({ status, body }, `${member.label} must be refused`).toMatchObject({
      status: 403,
      body: { code: 'permission_denied' },
    });
  }

  expect(await snapshot(ownerUrl), 'a refused request changed data').toEqual(before);

  for (const member of members.filter(({ admitted }) => admitted)) {
    const { status, body } = await attempt(member.headers);

    // Refused for another reason, such as a missing header or the wrong Organisation, is not admitted.
    expect(status, `${member.label} must be admitted; answered ${status} ${JSON.stringify(body)}`).not.toBeOneOf([
      401, 403,
    ]);
    expect(status, `${member.label} answered ${status} ${JSON.stringify(body)}`).toBeLessThan(500);
  }
}
