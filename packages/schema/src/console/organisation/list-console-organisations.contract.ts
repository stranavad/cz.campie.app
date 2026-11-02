import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { consoleOrganisationSchema } from './console-organisation.resource.ts';

// Every Organisation, the newest signup first.
export const listConsoleOrganisationsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/console/organisations',
  response: z.array(consoleOrganisationSchema),
});
