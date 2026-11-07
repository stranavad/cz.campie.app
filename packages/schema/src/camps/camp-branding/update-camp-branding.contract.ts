import { z } from 'zod';

import { accentColourSchema } from '@repo/schema/organisations';
import { defineEndpoint } from '@repo/schema/shared';

import { campBrandingParamsSchema, campBrandingSchema } from './camp-branding.resource.ts';

// Null returns the Camp to its Organisation's accent colour.
export const updateCampBrandingBodySchema = z.object({ accentColour: accentColourSchema.nullable() });

export type UpdateCampBrandingBody = z.infer<typeof updateCampBrandingBodySchema>;

// Sets a Camp's own accent colour, audited; Camp settings write.
export const updateCampBrandingEndpoint = defineEndpoint({
  method: 'PATCH',
  path: '/camps/:campId/branding',
  params: campBrandingParamsSchema,
  body: updateCampBrandingBodySchema,
  response: campBrandingSchema,
});
