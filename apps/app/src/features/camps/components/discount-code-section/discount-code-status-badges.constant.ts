import type { DiscountCodeStatus } from '@repo/schema/camps';

// How each status reads in the list: only a usable code stands out.
export const DISCOUNT_CODE_STATUS_BADGES = {
  valid: 'success',
  expired: 'neutral',
  exhausted: 'neutral',
  inactive: 'outline',
  unknown: 'warning',
} as const satisfies Record<DiscountCodeStatus, 'success' | 'neutral' | 'outline' | 'warning'>;
