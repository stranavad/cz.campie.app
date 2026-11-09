import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { signUpOrganisationBodySchema } from '../organisation/sign-up-organisation.contract.ts';
import { SUBDOMAIN_ERROR_CODES } from './subdomain.ts';

// Read as signup reads it.
export const checkSubdomainParamsSchema = z.object({ subdomain: signUpOrganisationBodySchema.shape.subdomain });

export type CheckSubdomainParams = z.infer<typeof checkSubdomainParamsSchema>;

export const checkSubdomainResponseSchema = z.object({
  // Free, or the code a signup with it would be refused with now.
  availability: z.enum(['available', ...SUBDOMAIN_ERROR_CODES]),
});

export type CheckSubdomainResponse = z.infer<typeof checkSubdomainResponseSchema>;

// Whether a signup could take a subdomain, for the signup form while the Owner types. Advisory only: the
// signup checks again. Rate limited per address like signups.
export const checkSubdomainEndpoint = defineEndpoint({
  method: 'GET',
  path: '/subdomains/:subdomain/availability',
  params: checkSubdomainParamsSchema,
  response: checkSubdomainResponseSchema,
});
