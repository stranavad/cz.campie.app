import { z } from 'zod';

import { AMOUNT_DUE_PHASES, PAYMENT_STATUSES } from '@repo/schema/pricing';
import { calendarDateSchema } from '@repo/schema/shared';

// Where a ledger entry comes from: an admin's record of money received, the card gateway, or an admin's
// Correcting payment, which takes money back (a refund or a mistake).
export const PAYMENT_SOURCES = ['manual', 'gateway', 'correction'] as const;

export type PaymentSource = (typeof PAYMENT_SOURCES)[number];

export const registrationParamsSchema = z.object({ registrationId: z.uuid() });

export type RegistrationParams = z.infer<typeof registrationParamsSchema>;

export const paymentEntrySchema = z.object({
  id: z.uuid(),
  source: z.enum(PAYMENT_SOURCES),
  // Whole CZK, negative for a Correcting payment.
  amount: z.number().int(),
  paidOn: calendarDateSchema,
  note: z.string(),
  recordedAt: z.iso.datetime(),
});

export type PaymentEntry = z.infer<typeof paymentEntrySchema>;

export const priceAdjustmentSchema = z.object({
  id: z.uuid(),
  amount: z.number().int(),
  note: z.string(),
  createdAt: z.iso.datetime(),
});

export type PriceAdjustment = z.infer<typeof priceAdjustmentSchema>;

// A Registration's money: its ledger, its Price adjustments, and what they come to now.
export const ledgerSchema = z.object({
  payments: z.array(paymentEntrySchema),
  adjustments: z.array(priceAdjustmentSchema),
  total: z.number().int(),
  paid: z.number().int(),
  // Negative when overpaid.
  balance: z.number().int(),
  status: z.enum(PAYMENT_STATUSES),
  amountDue: z.object({
    phase: z.enum(AMOUNT_DUE_PHASES),
    amount: z.number().int(),
    dueDate: calendarDateSchema.nullable(),
  }),
  overdue: z.boolean(),
});

export type Ledger = z.infer<typeof ledgerSchema>;
