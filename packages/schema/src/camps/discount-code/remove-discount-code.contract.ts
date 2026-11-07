import { defineEndpoint } from '@repo/schema/shared';

import { discountCodeParamsSchema } from './discount-code.resource.ts';

// Removes a Discount code no Registration has used, such as one with a typo, audited; Camp settings write.
// A used one answers discount_code_used and can only be switched off.
export const removeDiscountCodeEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/discount-codes/:discountCodeId',
  params: discountCodeParamsSchema,
});
