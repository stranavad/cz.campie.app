import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { consoleOrganisationParamsSchema, consoleOrganisationSchema } from './console-organisation.resource.ts';

export const renameOrganisationSubdomainBodySchema = z.object({
  // Checked like a signup's: the format, the reserved names and the taken ones, with a code each.
  subdomain: z.string().trim().toLowerCase(),
});

export type RenameOrganisationSubdomainBody = z.infer<typeof renameOrganisationSubdomainBodySchema>;

// Changes a pending Organisation's subdomain; an approved one's is fixed.
export const renameOrganisationSubdomainEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/console/organisations/:organisationId',
  params: consoleOrganisationParamsSchema,
  body: renameOrganisationSubdomainBodySchema,
  response: consoleOrganisationSchema,
});
