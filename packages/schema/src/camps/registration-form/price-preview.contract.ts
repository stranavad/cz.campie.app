import { z } from 'zod';

import { answerValueSchema } from '@repo/schema/form-engine';
import { PRICE_LINE_KINDS } from '@repo/schema/pricing';
import { defineEndpoint } from '@repo/schema/shared';

import { publicCampParamsSchema } from '../camp/get-public-camp.contract.ts';

const answersSchema = z.record(z.string().max(100), answerValueSchema);

// What a code turned out to be: applied, or why not.
export const DISCOUNT_CODE_CHECKS = ['applied', 'expired', 'exhausted', 'inactive', 'unknown'] as const;

export type DiscountCodeCheck = (typeof DISCOUNT_CODE_CHECKS)[number];

export const previewPriceBodySchema = z.object({
  turnusId: z.uuid(),
  // The answers that carry a surcharge, unchecked; the form sends no others, so typing a name asks
  // nothing. Each child is one entry, so the count is right.
  submission: z.object({ registration: answersSchema, participants: z.array(answersSchema).max(20) }),
  paymentChoice: z.enum(['full', 'deposit']),
  discountCode: z.string().trim().max(40).nullable(),
});

export type PreviewPriceBody = z.infer<typeof previewPriceBodySchema>;

export const priceLineSchema = z.object({
  kind: z.enum(PRICE_LINE_KINDS),
  participant: z.number().int().nullable(),
  label: z.string().nullable(),
  amount: z.number().int(),
});

export const previewPriceResponseSchema = z.object({
  lines: z.array(priceLineSchema),
  total: z.number().int(),
  depositAvailable: z.boolean(),
  depositTotal: z.number().int().nullable(),
  // Null when no code was typed.
  discountCode: z.enum(DISCOUNT_CODE_CHECKS).nullable(),
});

export type PreviewPriceResponse = z.infer<typeof previewPriceResponseSchema>;

// The price of the form as filled in so far, computed on the server by the pricing module, for a Turnus
// of the Camp found by its slug. No session; rate limited per address and per Organisation. The price
// stored at submission is computed again then.
export const previewPriceEndpoint = defineEndpoint({
  method: 'POST',
  path: '/public-camps/:slug/price-preview',
  params: publicCampParamsSchema,
  body: previewPriceBodySchema,
  response: previewPriceResponseSchema,
  status: 200,
});
