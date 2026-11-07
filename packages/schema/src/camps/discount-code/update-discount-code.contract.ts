import { z } from 'zod';

import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

import { usageLimitSchema } from './create-discount-code.contract.ts';
import { discountCodeParamsSchema, discountCodeSchema } from './discount-code.resource.ts';

export const updateDiscountCodeBodySchema = z
  .object({ active: z.boolean(), usageLimit: usageLimitSchema, expiresOn: calendarDateSchema.nullable() })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'discount_code_change_empty');

export type UpdateDiscountCodeBody = z.infer<typeof updateDiscountCodeBodySchema>;

// Switches a Discount code on or off, or changes its limit or expiry, audited; Camp settings write. Its
// text, kind and value stay what Registrations used it as.
export const updateDiscountCodeEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/discount-codes/:discountCodeId',
  params: discountCodeParamsSchema,
  body: updateDiscountCodeBodySchema,
  response: discountCodeSchema,
});
