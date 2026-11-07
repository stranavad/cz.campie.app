import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { ledgerSchema, registrationParamsSchema } from './ledger.resource.ts';

export const addPriceAdjustmentBodySchema = z.object({
  // Whole CZK, plus or minus, never zero.
  amount: z
    .number()
    .int()
    .min(-10_000_000)
    .max(10_000_000)
    .refine((amount) => amount !== 0, 'price_adjustment_zero'),
  note: z.string().trim().min(1).max(500),
});

export type AddPriceAdjustmentBody = z.infer<typeof addPriceAdjustmentBodySchema>;

// Why an adjustment was refused: it would take the total below zero.
export const PRICE_ADJUSTMENT_ERROR_CODES = ['price_adjustment_below_zero'] as const;

export type PriceAdjustmentErrorCode = (typeof PRICE_ADJUSTMENT_ERROR_CODES)[number];

// Adds a Price adjustment to a Registration, never changed or removed afterwards; audited. Registrations
// write.
export const addPriceAdjustmentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/price-adjustments',
  params: registrationParamsSchema,
  body: addPriceAdjustmentBodySchema,
  response: ledgerSchema,
});
