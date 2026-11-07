import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { defineEndpoint } from '@repo/schema/shared';

import { consentVersionSchema } from '../consent/consent.resource.ts';

// Per Participant and Consent, by the newest signature: none yet, signed, or signed and then Withdrawn.
export const CONSENT_STATES = ['unsigned', 'signed', 'withdrawn'] as const;

export type ConsentState = (typeof CONSENT_STATES)[number];

export const guardianConsentsParamsSchema = z.object({ registrationId: z.uuid() });

export type GuardianConsentsParams = z.infer<typeof guardianConsentsParamsSchema>;

// What a guardian has to sign for each Registered child: every Consent of the Camp by its newest version.
// Empty while the Camp's Consents module is off.
export const guardianConsentsSchema = z.object({
  participants: z.array(
    z.object({
      id: z.uuid(),
      firstName: z.string(),
      lastName: z.string(),
      consents: z.array(
        z.object({
          consentId: z.uuid(),
          title: z.string(),
          state: z.enum(CONSENT_STATES),
          // The version signed, which may be older than the newest; null while unsigned.
          signedVersion: z.number().int().nullable(),
          signedAt: z.iso.datetime().nullable(),
          // The signed PDF, once generated; the link lasts a few minutes.
          signedPdf: fileLinkSchema.nullable(),
        }),
      ),
    }),
  ),
});

export type GuardianConsents = z.infer<typeof guardianConsentsSchema>;

// The guardian's own Registrations, guardians and access emails alike.
export const listGuardianConsentsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations/:registrationId/consents',
  params: guardianConsentsParamsSchema,
  response: guardianConsentsSchema,
});

export const guardianConsentParamsSchema = z.object({
  registrationId: z.uuid(),
  participantId: z.uuid(),
  consentId: z.uuid(),
});

export type GuardianConsentParams = z.infer<typeof guardianConsentParamsSchema>;

export const consentSignatureSchema = z.object({
  consentVersionId: z.uuid(),
  answers: z.record(z.uuid(), z.boolean()),
  signerName: z.string(),
  signerPlace: z.string(),
  signedAt: z.iso.datetime(),
  signedPdf: fileLinkSchema.nullable(),
  // When the guardians withdrew it; its signed PDF stays.
  withdrawnAt: z.iso.datetime().nullable(),
});

export type ConsentSignature = z.infer<typeof consentSignatureSchema>;

// A Consent to read and sign for one child: its newest version in full, and the child's newest signature.
export const guardianConsentSchema = z.object({
  participant: z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string() }),
  version: consentVersionSchema,
  signature: consentSignatureSchema.nullable(),
  // Whether the signature may be withdrawn: signed, not withdrawn, on a withdrawable version.
  withdrawable: z.boolean(),
});

export type GuardianConsent = z.infer<typeof guardianConsentSchema>;

export const getGuardianConsentEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations/:registrationId/participants/:participantId/consents/:consentId',
  params: guardianConsentParamsSchema,
  response: guardianConsentSchema,
});

export const signConsentBodySchema = z.object({
  // The version the guardian read, so a version published meanwhile is never signed unread.
  consentVersionId: z.uuid(),
  answers: z.record(z.uuid(), z.boolean()),
  signerName: z.string().trim().min(3).max(200),
  signerPlace: z.string().trim().min(2).max(200),
});

export type SignConsentBody = z.infer<typeof signConsentBodySchema>;

// `consent_answers_invalid`: an answer is missing, refused where agreement is required, or unexpected; the
// fields name each item (`['answers', itemId]`) with a ConsentAnswerErrorCode. `consent_version_outdated`:
// a newer version was published since it was read.
export const SIGN_CONSENT_ERROR_CODES = ['consent_answers_invalid', 'consent_version_outdated'] as const;

export type SignConsentErrorCode = (typeof SIGN_CONSENT_ERROR_CODES)[number];

// Signs a Consent for one child by the typed name and place, with the evidence of the guardian session;
// the signed PDF follows from a job and is emailed to both guardians.
export const signConsentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/registrations/:registrationId/participants/:participantId/consents/:consentId/signatures',
  params: guardianConsentParamsSchema,
  body: signConsentBodySchema,
  response: guardianConsentSchema,
});

// `consent_not_withdrawable`: the version signed cannot be withdrawn; `consent_not_signed`: there is no
// signature in force to withdraw.
export const WITHDRAW_CONSENT_ERROR_CODES = ['consent_not_withdrawable', 'consent_not_signed'] as const;

export type WithdrawConsentErrorCode = (typeof WITHDRAW_CONSENT_ERROR_CODES)[number];

// Withdraws the child's newest signature of a withdrawable Consent, audited; its signed PDF stays.
export const withdrawConsentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/registrations/:registrationId/participants/:participantId/consents/:consentId/withdrawal',
  params: guardianConsentParamsSchema,
  response: guardianConsentSchema,
});
