import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { discountCodeSchema } from './discount-code.resource.ts';

// A Camp's Discount codes by code, each with its uses and status now; Camp settings read.
export const listDiscountCodesEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/discount-codes',
  params: campParamsSchema,
  response: z.array(discountCodeSchema),
});
