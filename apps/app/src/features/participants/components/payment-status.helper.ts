import type { PaymentStatus } from '@repo/schema/pricing';

// The pill colour of a payment status: paid is done, part paid waits for the rest, overpaid wants a refund.
export const PAYMENT_STATUS_VARIANT = {
  unpaid: 'neutral',
  partly_paid: 'warning',
  deposit_paid: 'warning',
  paid: 'success',
  overpaid: 'brand',
} as const satisfies Record<PaymentStatus, 'neutral' | 'warning' | 'success' | 'brand'>;
