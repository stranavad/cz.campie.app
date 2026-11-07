import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';

// A Camp's own branding, null where it uses its Organisation's, and the branding its pages show.
export const campBrandingSchema = z.object({
  accentColour: z.string().nullable(),
  logo: fileLinkSchema.nullable(),
  effective: z.object({
    accentColour: z.string(),
    logo: fileLinkSchema.nullable(),
  }),
});

export type CampBranding = z.infer<typeof campBrandingSchema>;

export const campBrandingParamsSchema = z.object({ campId: z.uuid() });

export type CampBrandingParams = z.infer<typeof campBrandingParamsSchema>;
