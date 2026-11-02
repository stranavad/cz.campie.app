import { defineEndpoint } from '@repo/schema/shared';

import { consoleOrganisationParamsSchema, consoleOrganisationSchema } from './console-organisation.resource.ts';

// Approves a pending Organisation: it may publish, and its subdomain is fixed from now on.
export const approveOrganisationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/console/organisations/:organisationId/approve',
  params: consoleOrganisationParamsSchema,
  response: consoleOrganisationSchema,
  status: 200,
});
