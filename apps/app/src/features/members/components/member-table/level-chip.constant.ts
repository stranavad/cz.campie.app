import type { PermissionLevel } from '@repo/schema/admins';

// The steps of the access scale: changes filled, reading plain, nothing faint.
export const LEVEL_CHIP_VARIANT = {
  write: 'neutral',
  read: 'plain',
  none: 'faint',
} as const satisfies Record<PermissionLevel, 'neutral' | 'plain' | 'faint'>;
