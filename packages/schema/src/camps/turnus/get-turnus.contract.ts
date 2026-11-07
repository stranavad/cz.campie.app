import { defineEndpoint } from '@repo/schema/shared';

import { turnusParamsSchema, turnusSchema } from './turnus.resource.ts';

// One Turnus; Camp settings read.
export const getTurnusEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId',
  params: turnusParamsSchema,
  response: turnusSchema,
});
