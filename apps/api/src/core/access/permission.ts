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
  // Null for the Platform operator under a support grant, who is no member.
  readonly membershipId: string | null;
  readonly owner: boolean;
  readonly permissions: Permissions;
  // Set when the Platform operator acts under a support grant: whether it allows changes, the grant and the
  // session, and whether the session entered under it (recorded in the Organisation's log).
  readonly support?: {
    readonly allowWrites: boolean;
    readonly grantId: string;
    readonly sessionId: string;
    readonly entered: boolean;
  };
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

// Marks the one change the Platform operator makes under a read-only support grant: recording that they
// entered.
export const SupportEntry = Reflector.createDecorator<true>();

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
