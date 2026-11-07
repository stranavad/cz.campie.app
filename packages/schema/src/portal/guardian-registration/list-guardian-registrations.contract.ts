import { defineEndpoint } from '@repo/schema/shared';

import { guardianPortalSchema } from './guardian-registration.resource.ts';

// The Registrations of the subdomain's Organisation that name the signed-in guardian, newest first, past
// ones included.
export const listGuardianRegistrationsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations',
  response: guardianPortalSchema,
});
