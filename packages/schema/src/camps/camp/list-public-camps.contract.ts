import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { publicCampSchema } from './get-public-camp.contract.ts';

// The subdomain's Organisation's Camps by name, for its landing page.
export const listPublicCampsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/public-camps',
  response: z.array(publicCampSchema),
});
