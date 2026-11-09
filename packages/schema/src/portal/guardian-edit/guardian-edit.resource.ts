import { z } from 'zod';

import { answerValueSchema, formDefinitionShape } from '@repo/schema/form-engine';
import { calendarDateSchema, emailSchema, phoneSchema } from '@repo/schema/shared';

const answersSchema = z.record(z.string().max(100), answerValueSchema);

// What a guardian may change on a Registration in the portal, and what they see read-only.
export const guardianEditSchema = z.object({
  // False from the Camp's contact-edit lock date on: everything is read-only then.
  editable: z.boolean(),
  lockDate: calendarDateSchema.nullable(),
  // The latest published form, which the new fields come from.
  definition: formDefinitionShape,
  // Fields the latest form asks that the Registration's own version did not: a guardian may answer them.
  newFieldIds: z.array(z.string()),
  // Answers to new fields with a surcharge already given: their price line is frozen, and only an admin
  // changes them. A per-Registration answer has no Participant.
  lockedAnswers: z.array(z.object({ participantId: z.uuid().nullable(), fieldId: z.string() })),
  guardians: z.array(
    z.object({
      position: z.number().int(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      phone: z.string().nullable(),
      // A new address waiting for its confirmation link to be followed.
      pendingEmail: z.string().nullable(),
    }),
  ),
  registrationAnswers: answersSchema,
  participants: z.array(
    z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string(), answers: answersSchema }),
  ),
  // Answers to fields the latest form no longer asks, read-only, under the label they were asked with; a
  // chosen option shows its label.
  removed: z.array(z.object({ participantId: z.uuid().nullable(), label: z.string(), value: answerValueSchema })),
});

export type GuardianEdit = z.infer<typeof guardianEditSchema>;

export const guardianPositionParamsSchema = z.object({
  registrationId: z.uuid(),
  position: z.enum(['1', '2']).transform(Number),
});

export type GuardianPositionParams = z.output<typeof guardianPositionParamsSchema>;

export const guardianContactBodySchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.union([z.literal('').transform(() => null), z.null(), phoneSchema]),
});

export type GuardianContactBody = z.infer<typeof guardianContactBodySchema>;

export const addGuardianBodySchema = guardianContactBodySchema.extend({ email: emailSchema });

export type AddGuardianBody = z.infer<typeof addGuardianBodySchema>;

export const guardianEmailChangeBodySchema = z.object({ email: emailSchema });

export type GuardianEmailChangeBody = z.infer<typeof guardianEmailChangeBodySchema>;

export const confirmGuardianEmailChangeBodySchema = z.object({ token: z.string().min(1).max(100) });

export type ConfirmGuardianEmailChangeBody = z.infer<typeof confirmGuardianEmailChangeBodySchema>;

// The address the link confirmed, which only its own mailbox received the link at.
export const confirmGuardianEmailChangeResponseSchema = z.object({ email: z.string() });

export type ConfirmGuardianEmailChangeResponse = z.infer<typeof confirmGuardianEmailChangeResponseSchema>;

export const answerNewFieldsBodySchema = z.object({
  registration: answersSchema,
  participants: z.array(z.object({ participantId: z.uuid(), answers: answersSchema })).max(20),
});

export type AnswerNewFieldsBody = z.infer<typeof answerNewFieldsBodySchema>;

// Codes of a refused edit, which the portal translates.
export const GUARDIAN_EDIT_ERROR_CODES = [
  // The Camp's contact-edit lock date has come.
  'registration_locked',
  // The Registration has two guardians already.
  'guardian_second_exists',
  // The other guardian has this address.
  'guardian_email_taken',
  // A surcharge answer is frozen once given.
  'answer_locked',
  // The confirmation link is unknown, used or expired.
  'email_change_invalid',
  'submission_invalid',
] as const;

export type GuardianEditErrorCode = (typeof GUARDIAN_EDIT_ERROR_CODES)[number];
