import { defineEndpoint } from '@repo/schema/shared';

import { consoleOrganisationParamsSchema, consoleOrganisationSchema } from './console-organisation.resource.ts';

// Suspends an approved Organisation: its subdomain goes offline and it sends no more mail.
export const suspendOrganisationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/console/organisations/:organisationId/suspend',
  params: consoleOrganisationParamsSchema,
  response: consoleOrganisationSchema,
  status: 200,
});
