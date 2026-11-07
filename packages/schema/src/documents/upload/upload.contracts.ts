import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

// A handed-in document: waiting for review, approved, or returned with a note to hand in again.
export const UPLOAD_STATUSES = ['pending', 'approved', 'returned'] as const;

export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

export const guardianUploadSchema = z.object({
  id: z.uuid(),
  status: z.enum(UPLOAD_STATUSES),
  // Why it was returned.
  note: z.string().nullable(),
  uploadedAt: z.iso.datetime(),
  // What was handed in, to open for a few minutes; null when handed in on paper.
  file: fileLinkSchema.nullable(),
});

export type GuardianUpload = z.infer<typeof guardianUploadSchema>;

export const guardianDocumentsParamsSchema = z.object({ registrationId: z.uuid() });

export type GuardianDocumentsParams = z.infer<typeof guardianDocumentsParamsSchema>;

// What a guardian's Registration has of the Camp's Document types: the downloads for its Turnus, the
// requirements, and per Registered child what was handed in for each, newest first. Empty while the
// Documents module is off.
export const guardianDocumentsSchema = z.object({
  downloads: z.array(z.object({ id: z.uuid(), name: z.string(), description: z.string(), file: fileLinkSchema })),
  requirements: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      description: z.string(),
      dueDate: calendarDateSchema.nullable(),
      blankForm: fileLinkSchema.nullable(),
    }),
  ),
  participants: z.array(
    z.object({
      id: z.uuid(),
      firstName: z.string(),
      lastName: z.string(),
      // By requirement id; a requirement nothing was handed in for is missing.
      uploads: z.record(z.uuid(), z.array(guardianUploadSchema)),
    }),
  ),
});

export type GuardianDocuments = z.infer<typeof guardianDocumentsSchema>;

export const listGuardianDocumentsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations/:registrationId/documents',
  params: guardianDocumentsParamsSchema,
  response: guardianDocumentsSchema,
});

export const uploadDocumentParamsSchema = z.object({
  registrationId: z.uuid(),
  participantId: z.uuid(),
  documentTypeId: z.uuid(),
});

export type UploadDocumentParams = z.infer<typeof uploadDocumentParamsSchema>;

// `document_upload_not_needed`: the requirement's newest document waits for review or was approved; only a
// returned one is handed in again.
export const UPLOAD_ERROR_CODES = ['document_upload_not_needed'] as const;

export type UploadErrorCode = (typeof UPLOAD_ERROR_CODES)[number];

// Hands in a PDF, JPG or PNG for a child's requirement, stored encrypted and Pending; a rejected file
// answers with a FileErrorCode. Guardians and access emails of the Registration; audited.
export const uploadDocumentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/portal/registrations/:registrationId/participants/:participantId/documents/:documentTypeId',
  params: uploadDocumentParamsSchema,
  upload: true,
  response: guardianDocumentsSchema,
});
