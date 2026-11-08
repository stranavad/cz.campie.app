import { z } from 'zod';

import { campPreviewSchema } from '@repo/schema/camps';
import { defineEndpoint } from '@repo/schema/shared';

import { consoleOrganisationParamsSchema } from './console-organisation.resource.ts';

// What the public pages of an Organisation awaiting approval will show: each Camp's page with its Turnusy.
export const organisationPreviewSchema = z.object({ camps: z.array(campPreviewSchema) });

export type OrganisationPreview = z.infer<typeof organisationPreviewSchema>;

// The public pages of an Organisation awaiting approval, for the Platform operator to look at before
// approving it; public data only. Anything else of the Organisation needs its support grant.
export const previewOrganisationEndpoint = defineEndpoint({
  method: 'GET',
  path: '/console/organisations/:organisationId/preview',
  params: consoleOrganisationParamsSchema,
  response: organisationPreviewSchema,
});
