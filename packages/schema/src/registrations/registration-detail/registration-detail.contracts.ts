import { z } from 'zod';

import { auditEntrySchema } from '@repo/schema/audit';
import { priceLineSchema } from '@repo/schema/camps';
import { fileLinkSchema } from '@repo/schema/files';
import { answerValueSchema, formDefinitionShape } from '@repo/schema/form-engine';
import { PAYMENT_CHOICES } from '@repo/schema/pricing';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

import { invoiceFileSchema, invoiceRequestSchema } from '../invoice-request/invoice-request.resource.ts';
import { ledgerSchema, registrationParamsSchema } from '../ledger/ledger.resource.ts';
import { PARTICIPANT_STATUSES } from '../registration/participant-status.ts';
import { REGISTRATION_SOURCES } from '../registration/registration-source.ts';

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
  // The option a standard choice's answer chose, as the form named it: the platform's by its i18n key, a
  // boarding place by its label; null for any other answer.
  option: z.object({ label: z.string().nullable(), labelKey: z.string().nullable() }).nullable(),
  state: z.enum(ANSWER_STATES),
});

export type AnswerRow = z.infer<typeof answerRowSchema>;

// Everything an admin needs to answer a guardian's question about a Registration. Health data only for an
// admin with Health read, and that view is audited.
export const registrationDetailSchema = z.object({
  id: z.uuid(),
  variableSymbol: z.string(),
  submittedAt: z.iso.datetime(),
  source: z.enum(REGISTRATION_SOURCES),
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
      // The mail provider reported the address undeliverable, so only login links still go there.
      undeliverable: z.boolean(),
    }),
  ),
  // Addresses an admin gave portal access, beyond the guardians.
  accessEmails: z.array(z.object({ id: z.uuid(), email: z.string(), undeliverable: z.boolean() })),
  participants: z.array(
    z.object({
      id: z.uuid(),
      position: z.number().int(),
      firstName: z.string(),
      lastName: z.string(),
      // Null once the Registration is erased.
      birthDate: calendarDateSchema.nullable(),
      ageOnStart: z.number().int().nullable(),
      status: z.enum(PARTICIPANT_STATUSES),
      prihlaska: fileLinkSchema.nullable(),
      answers: z.array(answerRowSchema),
    }),
  ),
  registrationAnswers: z.array(answerRowSchema),
  priceLines: z.array(priceLineSchema),
  ledger: ledgerSchema,
  invoiceRequest: invoiceRequestSchema.nullable(),
  // The invoices the camp uploaded to the Invoice request, oldest first; never removed.
  invoiceFiles: z.array(invoiceFileSchema),
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

// An entry of a Registration's history: as in the Organisation's audit log, without the IP address it was
// made from, which only the Owners see.
export const historyEntrySchema = auditEntrySchema.omit({ ipAddress: true });

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
