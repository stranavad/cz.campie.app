import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

import { UPLOAD_STATUSES } from '../upload/upload.contracts.ts';

export const adminUploadSchema = z.object({
  id: z.uuid(),
  status: z.enum(UPLOAD_STATUSES),
  note: z.string().nullable(),
  uploadedAt: z.iso.datetime(),
  // The guardian's email, or null when an admin handed it in.
  uploadedBy: z.string().nullable(),
  byAdmin: z.boolean(),
  // Null when handed in on paper; the link lasts a few minutes.
  file: fileLinkSchema.nullable(),
});

export type AdminUpload = z.infer<typeof adminUploadSchema>;

export const internalDocumentSchema = z.object({
  id: z.uuid(),
  // The uploaded file's name.
  name: z.string(),
  uploadedAt: z.iso.datetime(),
  file: fileLinkSchema,
});

export type InternalDocument = z.infer<typeof internalDocumentSchema>;

export const registrationDocumentsParamsSchema = z.object({ registrationId: z.uuid() });

export type RegistrationDocumentsParams = z.infer<typeof registrationDocumentsParamsSchema>;

// Each child's documents on a Registration's detail: per requirement what was handed in, newest first, and
// the Internal documents guardians never see.
export const registrationDocumentsSchema = z.object({
  requirements: z.array(z.object({ id: z.uuid(), name: z.string(), dueDate: calendarDateSchema.nullable() })),
  participants: z.array(
    z.object({
      id: z.uuid(),
      firstName: z.string(),
      lastName: z.string(),
      // By requirement id.
      uploads: z.record(z.uuid(), z.array(adminUploadSchema)),
      internal: z.array(internalDocumentSchema),
    }),
  ),
});

export type RegistrationDocuments = z.infer<typeof registrationDocumentsSchema>;

// Registrations read.
export const getRegistrationDocumentsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/registrations/:registrationId/documents',
  params: registrationDocumentsParamsSchema,
  response: registrationDocumentsSchema,
});

export const documentUploadParamsSchema = z.object({ uploadId: z.uuid() });

export type DocumentUploadParams = z.infer<typeof documentUploadParamsSchema>;

// `document_review_stale`: the document is no longer the newest for its requirement, or not in a state
// that takes this review.
export const REVIEW_ERROR_CODES = ['document_review_stale'] as const;

export type ReviewErrorCode = (typeof REVIEW_ERROR_CODES)[number];

// Approves a pending document; Registrations write; audited.
export const approveDocumentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/document-uploads/:uploadId/approve',
  params: documentUploadParamsSchema,
  response: adminUploadSchema,
});

export const returnDocumentBodySchema = z.object({ note: z.string().trim().min(1).max(1000) });

export type ReturnDocumentBody = z.infer<typeof returnDocumentBodySchema>;

// Returns a document with a note for the guardians to hand in again, emailed to both; Registrations write;
// audited.
export const returnDocumentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/document-uploads/:uploadId/return',
  params: documentUploadParamsSchema,
  body: returnDocumentBodySchema,
  response: adminUploadSchema,
});

export const childRequirementParamsSchema = z.object({
  registrationId: z.uuid(),
  participantId: z.uuid(),
  documentTypeId: z.uuid(),
});

export type ChildRequirementParams = z.infer<typeof childRequirementParamsSchema>;

// Hands in a file on the guardians' behalf, Approved at once; Registrations write; audited.
export const uploadDocumentOnBehalfEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/participants/:participantId/documents/:documentTypeId',
  params: childRequirementParamsSchema,
  upload: true,
  response: adminUploadSchema,
});

// Marks a requirement handed in on paper, Approved without a file; Registrations write; audited.
export const markDocumentOnPaperEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/participants/:participantId/documents/:documentTypeId/paper',
  params: childRequirementParamsSchema,
  response: adminUploadSchema,
});

export const childParamsSchema = z.object({ registrationId: z.uuid(), participantId: z.uuid() });

export type ChildParams = z.infer<typeof childParamsSchema>;

// Attaches an Internal document to a child, which guardians never see; Registrations write; audited.
export const addInternalDocumentEndpoint = defineEndpoint({
  method: 'POST',
  path: '/registrations/:registrationId/participants/:participantId/internal-documents',
  params: childParamsSchema,
  upload: true,
  response: internalDocumentSchema,
});

export const internalDocumentParamsSchema = z.object({ internalDocumentId: z.uuid() });

export type InternalDocumentParams = z.infer<typeof internalDocumentParamsSchema>;

// Removes an Internal document and its file; Registrations write; audited.
export const removeInternalDocumentEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/internal-documents/:internalDocumentId',
  params: internalDocumentParamsSchema,
});
