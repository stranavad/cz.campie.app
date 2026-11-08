import { z } from 'zod';

import { campParamsSchema, priceLineSchema } from '@repo/schema/camps';
import { answerValueSchema, formDefinitionShape } from '@repo/schema/form-engine';
import { defineEndpoint, emailSchema, phoneSchema } from '@repo/schema/shared';

import { registrationParamsSchema } from '../ledger/ledger.resource.ts';
import { registrationDetailSchema } from '../registration-detail/registration-detail.contracts.ts';
import {
  submitRegistrationBodySchema,
  submittedRegistrationSchema,
} from '../registration/submit-registration.contract.ts';

const answersSchema = z.record(z.string().max(100), answerValueSchema);

export const createRegistrationBodySchema = submitRegistrationBodySchema.extend({
  // Whether the guardians get the confirmation email, as after a public submission.
  sendConfirmation: z.boolean().default(true),
});

export type CreateRegistrationBody = z.infer<typeof createRegistrationBodySchema>;

// Creates a Registration from a phone call or a paper form: the same form, but outside the Registration
// window, over capacity and outside age limits, without mandatory declarations, and a Discount code past
// its limit or expiry still applies and counts as a use. Registrations write.
export const createRegistrationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/registrations',
  params: campParamsSchema,
  body: createRegistrationBodySchema,
  response: submittedRegistrationSchema,
});

export const editAnswersBodySchema = z.object({
  // Answers beyond the guardians, per Registration.
  registration: answersSchema,
  // A Participant's answers, its name and birth date included.
  participants: z.array(z.object({ participantId: z.uuid(), answers: answersSchema })).max(20),
});

export type EditAnswersBody = z.infer<typeof editAnswersBodySchema>;

// The price lines a change would add: reversals of surcharges no longer chosen, and new ones at today's
// prices. Saving adds exactly these.
export const priceChangeSchema = z.object({ lines: z.array(priceLineSchema) });

export type PriceChange = z.infer<typeof priceChangeSchema>;

// What changing answers would do to the price, without saving; Registrations write.
export const previewEditAnswersEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/answers/preview',
  params: registrationParamsSchema,
  body: editAnswersBodySchema,
  response: priceChangeSchema,
  status: 200,
});

// A change saved with the price lines its preview showed: a save that would add others is refused, so the
// admin always confirms what is charged.
export const saveEditAnswersBodySchema = editAnswersBodySchema.extend({ expectedLines: z.array(priceLineSchema) });

export type SaveEditAnswersBody = z.infer<typeof saveEditAnswersBodySchema>;

// Changes any answer the latest form asks, validated by the form engine; a changed Paid extra or Claimed
// discount adds exactly the previewed price lines. Audited; Registrations write.
export const editAnswersEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/registrations/:registrationId/answers',
  params: registrationParamsSchema,
  body: saveEditAnswersBodySchema,
  response: registrationDetailSchema,
});

export const addParticipantBodySchema = z.object({ answers: answersSchema });

export type AddParticipantBody = z.infer<typeof addParticipantBodySchema>;

// What adding a child would add to the price, without saving; Registrations write.
export const previewAddParticipantEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/participants/preview',
  params: registrationParamsSchema,
  body: addParticipantBodySchema,
  response: priceChangeSchema,
  status: 200,
});

export const saveAddParticipantBodySchema = addParticipantBodySchema.extend({
  expectedLines: z.array(priceLineSchema),
});

export type SaveAddParticipantBody = z.infer<typeof saveAddParticipantBodySchema>;

// Adds a child at the price list in force now, outside capacity and age limits, with exactly the previewed
// price lines. Audited; Registrations write.
export const addParticipantEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/participants',
  params: registrationParamsSchema,
  body: saveAddParticipantBodySchema,
  response: registrationDetailSchema,
});

export const moveRegistrationBodySchema = z.object({ turnusId: z.uuid() });

export type MoveRegistrationBody = z.infer<typeof moveRegistrationBodySchema>;

// Moves a whole Registration to another Turnus of its Camp, outside capacity and age limits; the price lines
// stay. Audited; Registrations write.
export const moveRegistrationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/move',
  params: registrationParamsSchema,
  body: moveRegistrationBodySchema,
  response: registrationDetailSchema,
});

export const adminGuardianParamsSchema = z.object({
  registrationId: z.uuid(),
  position: z.enum(['1', '2']).transform(Number),
});

export type AdminGuardianParams = z.output<typeof adminGuardianParamsSchema>;

export const editGuardianBodySchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  phone: z.union([z.literal('').transform(() => null), z.null(), phoneSchema]),
});

export type EditGuardianBody = z.infer<typeof editGuardianBodySchema>;

// Changes a guardian, the email at once; audited; Registrations write.
export const editGuardianEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/registrations/:registrationId/guardians/:position',
  params: adminGuardianParamsSchema,
  body: editGuardianBodySchema,
  response: registrationDetailSchema,
});

export const turnusFormParamsSchema = z.object({ turnusId: z.uuid() });

export type TurnusFormParams = z.infer<typeof turnusFormParamsSchema>;

// The form an admin fills in for a Turnus: its Camp's latest version.
export const turnusFormSchema = z.object({
  campId: z.uuid(),
  definition: formDefinitionShape,
  maxParticipants: z.number().int(),
  declarations: z.array(z.object({ id: z.uuid(), text: z.string(), mandatory: z.boolean() })),
});

export type TurnusForm = z.infer<typeof turnusFormSchema>;

// The latest form of a Turnus's Camp, for an admin creating a Registration; Registrations write.
export const getTurnusFormEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId/form',
  params: turnusFormParamsSchema,
  response: turnusFormSchema,
});

export const participantParamsSchema = z.object({ registrationId: z.uuid(), participantId: z.uuid() });

export type ParticipantParams = z.infer<typeof participantParamsSchema>;

// Cancels a Participant: its place is free at once, its record and every amount stay; storno fees and refunds
// are settled by hand. The guardians are told with the balance. Audited; Registrations write.
export const cancelParticipantEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/participants/:participantId/cancel',
  params: participantParamsSchema,
  response: registrationDetailSchema,
  status: 200,
});

// Cancels every Participant of a Registration, which has no state of its own. Audited; Registrations write.
export const cancelRegistrationEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/cancel',
  params: registrationParamsSchema,
  response: registrationDetailSchema,
  status: 200,
});

export const accessEmailBodySchema = z.object({ email: emailSchema });

export type AccessEmailBody = z.infer<typeof accessEmailBodySchema>;

// Gives another address, such as a grandparent's, access to the Registration in the portal; it receives no
// automatic email. Audited; Registrations write.
export const addAccessEmailEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/access-emails',
  params: registrationParamsSchema,
  body: accessEmailBodySchema,
  response: registrationDetailSchema,
});

export const accessEmailParamsSchema = z.object({ registrationId: z.uuid(), accessEmailId: z.uuid() });

export type AccessEmailParams = z.infer<typeof accessEmailParamsSchema>;

// Takes an access email's access away. Audited; Registrations write.
export const removeAccessEmailEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/registrations/:registrationId/access-emails/:accessEmailId',
  params: accessEmailParamsSchema,
  response: registrationDetailSchema,
});

// Clears the undeliverable mark of a guardian's or access email's address of the Registration, such as one the
// family says works again, so notification mail goes there again. Audited when there was a mark;
// Registrations write.
export const clearUndeliverableEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/clear-undeliverable',
  params: registrationParamsSchema,
  body: accessEmailBodySchema,
  response: registrationDetailSchema,
  status: 200,
});

// Removes one of two guardians, who loses access at once; the other becomes the first. Audited; Registrations
// write.
export const removeGuardianEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/registrations/:registrationId/guardians/:position',
  params: adminGuardianParamsSchema,
  response: registrationDetailSchema,
});

// Generates a Participant's Přihláška again from a job, replacing the stored one once the new one is stored.
// Audited; Registrations write.
export const regeneratePrihlaskaEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/participants/:participantId/prihlaska',
  params: participantParamsSchema,
  status: 202,
});

// Codes of a refused admin change, which the app translates.
export const ADMIN_REGISTRATION_ERROR_CODES = [
  'submission_invalid',
  'turnus_other_camp',
  'guardian_email_taken',
  // The price lines a save would add differ from its preview's, which the admin should see again.
  'price_changed',
  // A Registration keeps at least one guardian.
  'guardian_last',
  'access_email_taken',
] as const;

export type AdminRegistrationErrorCode = (typeof ADMIN_REGISTRATION_ERROR_CODES)[number];
