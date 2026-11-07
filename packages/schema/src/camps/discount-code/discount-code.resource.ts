import { z } from 'zod';

import { DISCOUNT_CODE_KINDS } from '@repo/schema/pricing';

import { DISCOUNT_CODE_STATUSES } from './discount-code-status.ts';

// A Camp's Discount code as its settings show it, with its uses so far and whether it works now.
export const discountCodeSchema = z.object({
  id: z.uuid(),
  campId: z.uuid(),
  code: z.string(),
  kind: z.enum(DISCOUNT_CODE_KINDS),
  // A percentage, or whole CZK.
  value: z.number().int(),
  usageLimit: z.number().int().nullable(),
  expiresOn: z.iso.date().nullable(),
  active: z.boolean(),
  uses: z.number().int(),
  status: z.enum(DISCOUNT_CODE_STATUSES),
});

export type DiscountCodeResource = z.infer<typeof discountCodeSchema>;

export const discountCodeParamsSchema = z.object({ discountCodeId: z.uuid() });

export type DiscountCodeParams = z.infer<typeof discountCodeParamsSchema>;

// Codes of a refused change: a code another of the Camp's codes already is, in any case; removing a code
// a Registration has used.
export const DISCOUNT_CODE_ERROR_CODES = ['discount_code_taken', 'discount_code_used'] as const;

export type DiscountCodeErrorCode = (typeof DISCOUNT_CODE_ERROR_CODES)[number];
