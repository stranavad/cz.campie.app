import { z } from 'zod';

import { priceLineSchema } from '@repo/schema/camps';
import { fileLinkSchema } from '@repo/schema/files';
import { answerValueSchema, formDefinitionShape } from '@repo/schema/form-engine';
import { PAYMENT_CHOICES } from '@repo/schema/pricing';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

import { ledgerSchema, registrationParamsSchema } from '../ledger/ledger.resource.ts';
import { PARTICIPANT_STATUSES } from '../registration/participant-status.ts';

// Whether a question was answered under the Registration's form, added to the form later, or removed
// from the latest form after it was answered.
export const ANSWER_STATES = ['answered', 'added', 'removed'] as const;

// One question and its answer: labelled as the Registration's form version asked it, a later field as the
// latest version does; a chosen option by its label; null when unanswered.
export const answerRowSchema = z.object({
  key: z.string(),
  label: z.string().nullable(),
  // For a core or standard field the app names, its i18n key.
  labelKey: z.string().nullable(),
  value: answerValueSchema,
  state: z.enum(ANSWER_STATES),
});

export type AnswerRow = z.infer<typeof answerRowSchema>;

// Everything an admin needs to answer a guardian's question about a Registration. Never health data.
export const registrationDetailSchema = z.object({
  id: z.uuid(),
  variableSymbol: z.string(),
  submittedAt: z.iso.datetime(),
  paymentChoice: z.enum(PAYMENT_CHOICES),
  formVersion: z.number().int(),
  // The Camp's latest form, whose fields an admin may answer.
  latestDefinition: formDefinitionShape,
  camp: z.object({ id: z.uuid(), name: z.string() }),
  turnus: z.object({ id: z.uuid(), name: z.string(), startDate: calendarDateSchema, endDate: calendarDateSchema }),
  guardians: z.array(
    z.object({
      position: z.number().int(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      phone: z.string().nullable(),
    }),
  ),
  // Addresses an admin gave portal access, beyond the guardians.
  accessEmails: z.array(z.object({ id: z.uuid(), email: z.string() })),
  participants: z.array(
    z.object({
      id: z.uuid(),
      position: z.number().int(),
      firstName: z.string(),
      lastName: z.string(),
      birthDate: calendarDateSchema,
      ageOnStart: z.number().int(),
      status: z.enum(PARTICIPANT_STATUSES),
      prihlaska: fileLinkSchema.nullable(),
      answers: z.array(answerRowSchema),
    }),
  ),
  registrationAnswers: z.array(answerRowSchema),
  priceLines: z.array(priceLineSchema),
  ledger: ledgerSchema,
  declarations: z.array(
    z.object({
      text: z.string(),
      mandatory: z.boolean(),
      accepted: z.boolean(),
      // Null for a declaration added to the form after the Registration was submitted.
      answeredAt: z.iso.datetime().nullable(),
    }),
  ),
  // Claimed discounts that need the camp's verification, and when they were confirmed.
  claimedDiscounts: z.array(
    z.object({
      participantId: z.uuid(),
      fieldId: z.string(),
      optionId: z.string().nullable(),
      label: z.string(),
      amount: z.number().int(),
      verifiedAt: z.iso.datetime().nullable(),
    }),
  ),
});

export type RegistrationDetail = z.infer<typeof registrationDetailSchema>;

// A Registration in full; Registrations read.
export const getRegistrationDetailEndpoint = defineEndpoint({
  method: 'GET',
  path: '/registrations/:registrationId',
  params: registrationParamsSchema,
  response: registrationDetailSchema,
});

export const historyEntrySchema = z.object({
  id: z.uuid(),
  occurredAt: z.iso.datetime(),
  actor: z.object({
    kind: z.enum(['admin', 'guardian', 'operator', 'system']),
    // An admin's email, a guardian's email, or null for the system or an erased identity.
    name: z.string().nullable(),
  }),
  action: z.string(),
  // Old and new values of plain fields; encrypted fields by name only.
  changes: z.record(z.string(), z.object({ old: z.unknown(), new: z.unknown() })).nullable(),
  encryptedFields: z.array(z.string()),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

// The audit entries of a Registration and its Participants, newest first; Registrations read.
export const getRegistrationHistoryEndpoint = defineEndpoint({
  method: 'GET',
  path: '/registrations/:registrationId/history',
  params: registrationParamsSchema,
  response: z.array(historyEntrySchema),
});

export const verifyClaimedDiscountBodySchema = z.object({
  participantId: z.uuid(),
  fieldId: z.string().max(100),
  optionId: z.string().max(100).nullable(),
});

export type VerifyClaimedDiscountBody = z.infer<typeof verifyClaimedDiscountBodySchema>;

// Why a confirmation was refused: the Participant has no such Claimed discount needing verification.
export const CLAIMED_DISCOUNT_ERROR_CODES = ['claimed_discount_unknown'] as const;

export type ClaimedDiscountErrorCode = (typeof CLAIMED_DISCOUNT_ERROR_CODES)[number];

// Confirms a Claimed discount after checking it, audited; Registrations write. A wrong one is reversed by a
// Price adjustment instead.
export const verifyClaimedDiscountEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/claimed-discounts/verify',
  params: registrationParamsSchema,
  body: verifyClaimedDiscountBodySchema,
  response: registrationDetailSchema,
});
