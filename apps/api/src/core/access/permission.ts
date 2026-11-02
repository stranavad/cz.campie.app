import { Reflector } from '@nestjs/core';

import { levelIncludes, type PermissionArea, type PermissionLevel, type Permissions } from '@repo/schema/admins';

// A level a route can require; none is required of nobody.
type RequiredLevel = Exclude<PermissionLevel, 'none'>;

// What an admin route requires of the membership the request acts through: a level in one area, being an
// Owner, or only being a member, for what every member may see.
export type PermissionRequirement =
  | { readonly area: PermissionArea; readonly level: RequiredLevel }
  | { readonly owner: true }
  | { readonly member: true };

// The membership an admin request acts through, as the access guard resolved it.
export interface MemberAccess {
  readonly membershipId: string;
  readonly owner: boolean;
  readonly permissions: Permissions;
}

// Declared on every route of an admin controller, or on the controller for all its routes, where a route's
// own replaces its controller's; the app refuses to boot with an admin route that has none, and with one
// on a controller that is not admin.
export const RequirePermission = Reflector.createDecorator<PermissionRequirement>();

/**
 * Require a level in an area (`'registrations', 'read'`), being an Owner (`'owner'`), or only being a
 * member (`'member'`).
 * @param requirement the area and its level, or the role
 */
export function Requires(
  ...requirement: [area: PermissionArea, level: RequiredLevel] | ['owner'] | ['member']
): ClassDecorator & MethodDecorator {
  if (requirement.length === 2) {
    const [area, level] = requirement;

    return RequirePermission({ area, level });
  }

  return RequirePermission(requirement[0] === 'owner' ? { owner: true } : { member: true });
}

/**
 * Whether a membership meets a requirement. An Owner meets every one, at write in every area.
 * @param member the membership the request acts through
 * @param requirement what is required
 */
export function allows(member: MemberAccess, requirement: PermissionRequirement): boolean {
  if (member.owner || 'member' in requirement) {
    return true;
  }

  if ('owner' in requirement) {
    return false;
  }

  return levelIncludes(member.permissions[requirement.area], requirement.level);
}
