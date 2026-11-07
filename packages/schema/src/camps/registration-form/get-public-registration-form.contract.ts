import { defineEndpoint } from '@repo/schema/shared';

import { publicCampParamsSchema } from '../camp/get-public-camp.contract.ts';
import { registrationFormVersionSchema } from './registration-form.resource.ts';

// The latest published version of a Camp's registration form, by its slug or a former one, on the
// Organisation's subdomain. Not found before the first publish and while the Organisation awaits approval.
export const getPublicRegistrationFormEndpoint = defineEndpoint({
  method: 'GET',
  path: '/public-camps/:slug/registration-form',
  params: publicCampParamsSchema,
  response: registrationFormVersionSchema,
});
