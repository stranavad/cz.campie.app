import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { defineEndpoint } from '@repo/schema/shared';

import { consentContentSchema, consentSchema, consentSummarySchema } from './consent.resource.ts';

export const campConsentsParamsSchema = z.object({ campId: z.uuid() });

export type CampConsentsParams = z.infer<typeof campConsentsParamsSchema>;

export const consentParamsSchema = z.object({ campId: z.uuid(), consentId: z.uuid() });

export type ConsentParams = z.infer<typeof consentParamsSchema>;

// `consent_file_unknown`: the content names a PDF not uploaded for the Camp's Consents.
export const CONSENT_ERROR_CODES = ['consent_file_unknown'] as const;

export type ConsentErrorCode = (typeof CONSENT_ERROR_CODES)[number];

// A Camp's Consents, each by its newest version with its progress, oldest Consent first; Camp settings read.
export const listConsentsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/consents',
  params: campConsentsParamsSchema,
  response: z.array(consentSummarySchema),
});

// One Consent with all its versions; Camp settings read.
export const getConsentEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/consents/:consentId',
  params: consentParamsSchema,
  response: consentSchema,
});

// Creates a Consent and publishes its version 1, audited; Camp settings write.
export const createConsentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/consents',
  params: campConsentsParamsSchema,
  body: consentContentSchema,
  response: consentSchema,
});

// Publishes changed content as the Consent's next version, audited; the earlier versions, and what was
// signed on them, stay as they are. Unchanged content publishes nothing. Camp settings write.
export const publishConsentEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/consents/:consentId',
  params: consentParamsSchema,
  body: consentContentSchema,
  response: consentSchema,
});

export const uploadedConsentFileSchema = z.object({ fileId: z.uuid(), sha256: z.string(), link: fileLinkSchema });

export type UploadedConsentFile = z.infer<typeof uploadedConsentFileSchema>;

// Stores a PDF for the Camp's Consents, encrypted, with its SHA-256; a rejected file answers with a
// FileErrorCode. Camp settings write.
export const uploadConsentFileEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/consent-files',
  params: campConsentsParamsSchema,
  upload: true,
  response: uploadedConsentFileSchema,
});
