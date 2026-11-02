import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

// The Organisation whose subdomain the page is on, as its public pages show it.
export const publicOrganisationSchema = z.object({
  displayName: z.string(),
});

export type PublicOrganisation = z.infer<typeof publicOrganisationSchema>;

// Answers organisation_suspended for a suspended Organisation, like every public and guardian route.
export const getPublicOrganisationEndpoint = defineEndpoint({
  method: 'GET',
  path: '/organisation',
  response: publicOrganisationSchema,
});
