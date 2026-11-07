import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { publicCampParamsSchema } from '../camp/get-public-camp.contract.ts';
import { publicTurnusSchema } from './public-turnus.resource.ts';

// A Camp's Turnusy by start date on its public page, found by its slug or a former one.
export const listPublicTurnusyEndpoint = defineEndpoint({
  method: 'GET',
  path: '/public-camps/:slug/turnusy',
  params: publicCampParamsSchema,
  response: z.array(publicTurnusSchema),
});
