import { defineEndpoint } from '@repo/schema/shared';

import { campBrandingParamsSchema, campBrandingSchema } from './camp-branding.resource.ts';

// Gives a Camp its own logo, like the Organisation's; Camp settings write.
export const setCampLogoEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/branding/logo',
  params: campBrandingParamsSchema,
  upload: true,
  response: campBrandingSchema,
});
