import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema, campSchema } from './camp.resource.ts';

// One Camp's settings; Camp settings read.
export const getCampEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId',
  params: campParamsSchema,
  response: campSchema,
});
