import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { defineEndpoint } from '@repo/schema/shared';

import { CONSENT_STATES } from '../signature/signature.contracts.ts';

export const registrationConsentsParamsSchema = z.object({ registrationId: z.uuid() });

export type RegistrationConsentsParams = z.infer<typeof registrationConsentsParamsSchema>;

// One signature as an admin sees it: the newest is in force, earlier ones superseded.
export const adminSignatureSchema = z.object({
  id: z.uuid(),
  version: z.number().int(),
  signerName: z.string(),
  signedAt: z.iso.datetime(),
  withdrawnAt: z.iso.datetime().nullable(),
  superseded: z.boolean(),
  // Whether the signed PDF is generated yet.
  hasPdf: z.boolean(),
});

export type AdminSignature = z.infer<typeof adminSignatureSchema>;

// Each child's Consents on a Registration's detail: the state, the yes/no items declined by the signature in
// force, and every signature, newest first.
export const registrationConsentsSchema = z.object({
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
          declinedItems: z.array(z.string()),
          signatures: z.array(adminSignatureSchema),
        }),
      ),
    }),
  ),
});

export type RegistrationConsents = z.infer<typeof registrationConsentsSchema>;

// Registrations read.
export const getRegistrationConsentsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/registrations/:registrationId/consents',
  params: registrationConsentsParamsSchema,
  response: registrationConsentsSchema,
});

export const turnusConsentsParamsSchema = z.object({ turnusId: z.uuid() });

export type TurnusConsentsParams = z.infer<typeof turnusConsentsParamsSchema>;

// The Turnus's Registered children against the Camp's Consents, each cell the child's state.
export const turnusConsentsSchema = z.object({
  consents: z.array(z.object({ id: z.uuid(), title: z.string() })),
  participants: z.array(
    z.object({
      id: z.uuid(),
      registrationId: z.uuid(),
      firstName: z.string(),
      lastName: z.string(),
      // By Consent id.
      states: z.record(z.uuid(), z.enum(CONSENT_STATES)),
    }),
  ),
});

export type TurnusConsents = z.infer<typeof turnusConsentsSchema>;

// Registrations read.
export const getTurnusConsentsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/turnusy/:turnusId/consents',
  params: turnusConsentsParamsSchema,
  response: turnusConsentsSchema,
});

export const signedConsentParamsSchema = z.object({ signatureId: z.uuid() });

export type SignedConsentParams = z.infer<typeof signedConsentParamsSchema>;

// A short-lived link to a signature's signed PDF, current or superseded, audited; Registrations read.
export const downloadSignedConsentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/consent-signatures/:signatureId/download',
  params: signedConsentParamsSchema,
  response: fileLinkSchema,
});
