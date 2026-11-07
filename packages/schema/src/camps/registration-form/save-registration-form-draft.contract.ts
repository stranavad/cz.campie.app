import { z } from 'zod';

import { formDefinitionSchema } from '@repo/schema/form-engine';
import { defineEndpoint } from '@repo/schema/shared';

import { campParamsSchema } from '../camp/camp.resource.ts';
import { declarationsSchema } from './declaration.ts';
import { REGISTRATION_FIELD_CATALOGUE } from './registration-field-catalogue.ts';
import { maxParticipantsSchema, registrationFormSchema } from './registration-form.resource.ts';

export const saveRegistrationFormDraftBodySchema = z.object({
  definition: formDefinitionSchema(REGISTRATION_FIELD_CATALOGUE),
  maxParticipants: maxParticipantsSchema,
  declarations: declarationsSchema,
});

export type SaveRegistrationFormDraftBody = z.infer<typeof saveRegistrationFormDraftBodySchema>;

// Replaces a Camp's draft, its declarations included; guardians keep the published version until the next
// publish. A declaration's PDF must be one uploaded for the form (declaration_file_unknown). Camp settings
// write.
export const saveRegistrationFormDraftEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/registration-form/draft',
  params: campParamsSchema,
  body: saveRegistrationFormDraftBodySchema,
  response: registrationFormSchema,
});
