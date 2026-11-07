import { pragueDateOf } from '@repo/schema/shared';

// Whether a Discount code can be used now, and why not.
export const DISCOUNT_CODE_STATUSES = ['valid', 'expired', 'exhausted', 'inactive', 'unknown'] as const;

export type DiscountCodeStatus = (typeof DISCOUNT_CODE_STATUSES)[number];

export interface DiscountCodeRules {
  readonly active: boolean;
  readonly usageLimit: number | null;
  // Inclusive, on the Prague calendar.
  readonly expiresOn: string | null;
}

/**
 * Tell whether a Discount code can be used at an instant: switched on, not past its expiry day in Prague,
 * and with uses left.
 * @param code the code's rules, or null when the Camp has no such code
 * @param uses how many Registrations have used it
 * @param now the instant
 */
export function discountCodeStatus(code: DiscountCodeRules | null, uses: number, now: Date): DiscountCodeStatus {
  if (code === null) {
    return 'unknown';
  }

  if (!code.active) {
    return 'inactive';
  }

  if (code.expiresOn !== null && pragueDateOf(now) > code.expiresOn) {
    return 'expired';
  }

  return code.usageLimit !== null && uses >= code.usageLimit ? 'exhausted' : 'valid';
}
