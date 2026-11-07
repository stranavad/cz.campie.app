import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

import { guardianRegistrationSchema } from './guardian-registration.resource.ts';

// The Registrations of the subdomain's Organisation that name the signed-in guardian, newest first.
export const listGuardianRegistrationsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations',
  response: z.array(guardianRegistrationSchema),
});
