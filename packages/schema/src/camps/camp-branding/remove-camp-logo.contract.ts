import { defineEndpoint } from '@repo/schema/shared';

import { campBrandingParamsSchema, campBrandingSchema } from './camp-branding.resource.ts';

// Returns a Camp to its Organisation's logo; Camp settings write.
export const removeCampLogoEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/camps/:campId/branding/logo',
  params: campBrandingParamsSchema,
  response: campBrandingSchema,
});
