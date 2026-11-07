import { defineEndpoint } from '@repo/schema/shared';

import { turnusParamsSchema } from './turnus.resource.ts';

// Removes a Turnus, audited; Camp settings write.
export const removeTurnusEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/turnusy/:turnusId',
  params: turnusParamsSchema,
});
