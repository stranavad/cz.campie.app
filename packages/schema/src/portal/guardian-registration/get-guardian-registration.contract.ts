import { defineEndpoint } from '@repo/schema/shared';

import { guardianRegistrationParamsSchema, guardianRegistrationSchema } from './guardian-registration.resource.ts';

// One Registration that names the signed-in guardian; any other answers 404.
export const getGuardianRegistrationEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations/:registrationId',
  params: guardianRegistrationParamsSchema,
  response: guardianRegistrationSchema,
});
