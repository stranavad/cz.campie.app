import { defineEndpoint } from '@repo/schema/shared';

import { campBrandingParamsSchema, campBrandingSchema } from './camp-branding.resource.ts';

// A Camp's branding; Camp settings read.
export const getCampBrandingEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/branding',
  params: campBrandingParamsSchema,
  response: campBrandingSchema,
});
