import { levelIncludes, type Account, type PermissionArea, type PermissionLevel } from '@repo/schema/admins';

/**
 * Tell whether a membership may do something: an Owner may do everything, a member what their level in the
 * area includes. The API decides; this only shapes what the page offers.
 * @param membership the admin's membership, if known
 * @param area the permission area
 * @param level the level needed
 */
export function membershipAllows(
  membership: Account['memberships'][number] | undefined,
  area: PermissionArea,
  level: PermissionLevel,
): boolean {
  return membership !== undefined && (membership.owner || levelIncludes(membership.permissions[area], level));
}
