import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { registrationFormSchema } from './registration-form.resource.ts';

// A Camp's registration form for the builder; a Camp that never saved one has the preset draft. Camp
// settings read.
export const getRegistrationFormEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/registration-form',
  params: campParamsSchema,
  response: registrationFormSchema,
});
