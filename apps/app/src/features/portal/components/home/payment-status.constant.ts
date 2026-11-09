import type { PaymentStatus } from '@repo/schema/pricing';

// The badge colour of a Registration's payment status.
export const PAYMENT_STATUS_BADGES = {
  unpaid: 'warning',
  partly_paid: 'warning',
  deposit_paid: 'brand',
  paid: 'success',
  overpaid: 'neutral',
} as const satisfies Record<PaymentStatus, 'warning' | 'brand' | 'success' | 'neutral'>;
