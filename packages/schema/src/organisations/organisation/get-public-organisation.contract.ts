import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

// The Organisation whose subdomain the page is on, as its public pages show it.
export const publicOrganisationSchema = z.object({
  displayName: z.string(),
  accentColour: z.string(),
  // Served on the Organisation's own subdomain; a new logo gets a new address.
  logoUrl: z.string().nullable(),
  // The contact the Owner keeps in the settings for guardians, shown on pages without a Camp; never the
  // billing address.
  contactEmail: z.string(),
  contactPhone: z.string(),
});

export type PublicOrganisation = z.infer<typeof publicOrganisationSchema>;

// Answers organisation_suspended for a suspended Organisation, like every public and guardian route.
export const getPublicOrganisationEndpoint = defineEndpoint({
  method: 'GET',
  path: '/organisation',
  response: publicOrganisationSchema,
});
