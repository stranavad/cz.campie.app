import { z } from 'zod';

import { DISCOUNT_CODE_KINDS } from '@repo/schema/pricing';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { discountCodeSchema } from './discount-code.resource.ts';

// Plain letters, digits and hyphens: anyone can type it, no two codes look alike, and case is compared the
// same everywhere.
export const discountCodeTextSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{3,40}$/, 'discount_code_malformed');

export const usageLimitSchema = z.number().int().min(1).max(1_000_000).nullable();

export const createDiscountCodeBodySchema = z
  .object({
    code: discountCodeTextSchema,
    kind: z.enum(DISCOUNT_CODE_KINDS),
    value: z.number().int(),
    usageLimit: usageLimitSchema,
    expiresOn: calendarDateSchema.nullable(),
  })
  .superRefine(({ kind, value }, context) => {
    const fits = kind === 'percentage' ? value >= 1 && value <= 100 : value >= 1 && value <= 10_000_000;

    if (!fits) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: kind === 'percentage' ? 'discount_percentage_invalid' : 'discount_amount_invalid',
      });
    }
  });

export type CreateDiscountCodeBody = z.infer<typeof createDiscountCodeBodySchema>;

// Adds a Discount code to a Camp, audited; Camp settings write. A code the Camp has in any case answers
// discount_code_taken.
export const createDiscountCodeEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/discount-codes',
  params: campParamsSchema,
  body: createDiscountCodeBodySchema,
  response: discountCodeSchema,
});
