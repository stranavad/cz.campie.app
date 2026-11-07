import { z } from 'zod';

import { formDefinitionSchema } from '@repo/schema/form-engine';
import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { REGISTRATION_FIELD_CATALOGUE } from './registration-field-catalogue.ts';
import { maxParticipantsSchema, registrationFormSchema } from './registration-form.resource.ts';

export const saveRegistrationFormDraftBodySchema = z.object({
  definition: formDefinitionSchema(REGISTRATION_FIELD_CATALOGUE),
  maxParticipants: maxParticipantsSchema,
});

export type SaveRegistrationFormDraftBody = z.infer<typeof saveRegistrationFormDraftBodySchema>;

// Replaces a Camp's draft; guardians keep the published version until the next publish. Camp settings
// write.
export const saveRegistrationFormDraftEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/registration-form/draft',
  params: campParamsSchema,
  body: saveRegistrationFormDraftBodySchema,
  response: registrationFormSchema,
});
