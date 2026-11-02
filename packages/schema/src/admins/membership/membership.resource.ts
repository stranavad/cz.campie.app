// The areas an admin's membership grants a level in; an Owner holds write in all of them.
export const PERMISSION_AREAS = ['registrations', 'campSettings', 'health', 'oddily', 'vedouci'] as const;

export type PermissionArea = (typeof PERMISSION_AREAS)[number];

// Ordered: each level includes the ones before it.
export const PERMISSION_LEVELS = ['none', 'read', 'write'] as const;

export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export type Permissions = Readonly<Record<PermissionArea, PermissionLevel>>;

/**
 * Whether a held level includes a needed one: write includes read, and anything includes none.
 * @param held the level a membership holds
 * @param needed the level something requires
 */
export function levelIncludes(held: PermissionLevel, needed: PermissionLevel): boolean {
  return PERMISSION_LEVELS.indexOf(held) >= PERMISSION_LEVELS.indexOf(needed);
}
