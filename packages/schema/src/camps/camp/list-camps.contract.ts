import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { campSummarySchema } from './camp.resource.ts';

// The current Organisation's Camps by name, for any of its admins.
export const listCampsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps',
  response: z.array(campSummarySchema),
});
