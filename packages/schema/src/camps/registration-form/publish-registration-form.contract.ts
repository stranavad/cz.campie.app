import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { registrationFormVersionSchema } from './registration-form.resource.ts';

// Publishes a Camp's draft as its next version, audited; Camp settings write. Allowed before the
// Organisation is approved, so it can be previewed; guardians see it only once it is. Answers
// form_field_changed when a custom field changed type or scope since the last version.
export const publishRegistrationFormEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/registration-form/versions',
  params: campParamsSchema,
  response: registrationFormVersionSchema,
});
