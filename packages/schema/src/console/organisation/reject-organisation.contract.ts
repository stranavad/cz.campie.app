import { defineEndpoint } from '@repo/schema/shared';

import { consoleOrganisationParamsSchema } from './console-organisation.resource.ts';

// Rejects a pending Organisation: it is deleted with everything it holds, and its subdomain is free again.
export const rejectOrganisationEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/console/organisations/:organisationId',
  params: consoleOrganisationParamsSchema,
});
