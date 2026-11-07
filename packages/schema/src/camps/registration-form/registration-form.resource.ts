import { z } from 'zod';

import { formDefinitionShape } from '@repo/schema/form-engine';

// How many children one Registration may hold, unless the Camp says otherwise.
export const DEFAULT_MAX_PARTICIPANTS = 4;
// The most a Camp may allow; the form engine's own bound is above it.
export const MAX_PARTICIPANTS_LIMIT = 10;

export const maxParticipantsSchema = z.number().int().min(1).max(MAX_PARTICIPANTS_LIMIT);

// A version of a Camp's registration form as guardians fill it in: published once, never changed.
export const registrationFormVersionSchema = z.object({
  version: z.number().int(),
  definition: formDefinitionShape,
  maxParticipants: z.number().int(),
  publishedAt: z.iso.datetime(),
});

export type RegistrationFormVersion = z.infer<typeof registrationFormVersionSchema>;

// A Camp's registration form as the builder shows it: the draft an admin edits, and the latest published
// version guardians see.
export const registrationFormSchema = z.object({
  campId: z.uuid(),
  draft: formDefinitionShape,
  maxParticipants: z.number().int(),
  latest: registrationFormVersionSchema.omit({ definition: true }).nullable(),
});

export type RegistrationForm = z.infer<typeof registrationFormSchema>;

// Codes of a refused publish: a custom field kept under its id with another type or scope than in an
// earlier version, whose answers on existing Registrations would no longer fit it; a draft that no longer
// holds together.
export const REGISTRATION_FORM_ERROR_CODES = ['form_field_changed', 'form_definition_invalid'] as const;

export type RegistrationFormErrorCode = (typeof REGISTRATION_FORM_ERROR_CODES)[number];
