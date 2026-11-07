import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

export const publicCampParamsSchema = z.object({ slug: z.string().max(100) });

export type PublicCampParams = z.infer<typeof publicCampParamsSchema>;

// A Camp of the subdomain's Organisation as its public pages show it, with the branding they wear. Found
// by its slug or a former one; `slug` is the current one, so a page reached by a former one can move.
export const publicCampSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  websiteUrl: z.string().nullable(),
  // Whom guardians ask, shown with any problem the form cannot solve itself.
  contactName: z.string().nullable(),
  contactEmail: z.string(),
  contactPhone: z.string().nullable(),
  accentColour: z.string(),
  logoUrl: z.string().nullable(),
  // Whether the Organisation takes card payments, so the form offers the choice.
  cardPayments: z.boolean(),
});

export type PublicCamp = z.infer<typeof publicCampSchema>;

export const getPublicCampEndpoint = defineEndpoint({
  method: 'GET',
  path: '/public-camps/:slug',
  params: publicCampParamsSchema,
  response: publicCampSchema,
});
