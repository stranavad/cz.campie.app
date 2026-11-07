import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { turnusBodySchema } from './turnus-body.ts';
import { turnusSchema } from './turnus.resource.ts';

// Adds a Turnus to a Camp, audited; Camp settings write.
export const createTurnusEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/turnusy',
  params: campParamsSchema,
  body: turnusBodySchema,
  response: turnusSchema,
});
