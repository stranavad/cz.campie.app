import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { turnusSchema } from './turnus.resource.ts';

// A Camp's Turnusy by start date; Camp settings read.
export const listTurnusyEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/turnusy',
  params: campParamsSchema,
  response: z.array(turnusSchema),
});
