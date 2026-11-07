import { z } from 'zod';

import { fileLinkSchema } from '@repo/schema/files';
import { calendarDateSchema, defineEndpoint } from '@repo/schema/shared';

// A download is a file the Camp publishes; a requirement is a document each child must hand in.
export const DOCUMENT_TYPE_KINDS = ['download', 'requirement'] as const;

export type DocumentTypeKind = (typeof DOCUMENT_TYPE_KINDS)[number];

export const documentTypeSchema = z.object({
  id: z.uuid(),
  kind: z.enum(DOCUMENT_TYPE_KINDS),
  name: z.string(),
  description: z.string(),
  // A requirement's due date; null for a download or none.
  dueDate: calendarDateSchema.nullable(),
  // The Turnusy a download is for; empty for every Turnus of the Camp, and always for a requirement.
  turnusIds: z.array(z.uuid()),
  // The published file of a download, or a requirement's blank form; the link lasts a few minutes.
  file: z.object({ id: z.uuid(), link: fileLinkSchema }).nullable(),
});

export type DocumentType = z.infer<typeof documentTypeSchema>;

export const documentTypeBodySchema = z
  .object({
    kind: z.enum(DOCUMENT_TYPE_KINDS),
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000),
    dueDate: calendarDateSchema.nullable(),
    turnusIds: z
      .array(z.uuid())
      .max(50)
      .refine((ids) => new Set(ids).size === ids.length, 'document_type_turnus_repeated'),
  })
  .refine(({ kind, dueDate }) => kind === 'requirement' || dueDate === null, {
    path: ['dueDate'],
    message: 'document_type_due_date_download',
  })
  .refine(({ kind, turnusIds }) => kind === 'download' || turnusIds.length === 0, {
    path: ['turnusIds'],
    message: 'document_type_turnusy_requirement',
  });

export type DocumentTypeBody = z.infer<typeof documentTypeBodySchema>;

export const campDocumentTypesParamsSchema = z.object({ campId: z.uuid() });

export type CampDocumentTypesParams = z.infer<typeof campDocumentTypesParamsSchema>;

export const documentTypeParamsSchema = z.object({ campId: z.uuid(), documentTypeId: z.uuid() });

export type DocumentTypeParams = z.infer<typeof documentTypeParamsSchema>;

// `document_type_turnus_unknown`: a Turnus named is not the Camp's.
export const DOCUMENT_TYPE_ERROR_CODES = ['document_type_turnus_unknown'] as const;

export type DocumentTypeErrorCode = (typeof DOCUMENT_TYPE_ERROR_CODES)[number];

// A Camp's Document types, oldest first; Camp settings read.
export const listDocumentTypesEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/document-types',
  params: campDocumentTypesParamsSchema,
  response: z.array(documentTypeSchema),
});

// Camp settings write; audited.
export const createDocumentTypeEndpoint = defineEndpoint({
  method: 'POST',
  path: '/camps/:campId/document-types',
  params: campDocumentTypesParamsSchema,
  body: documentTypeBodySchema,
  response: documentTypeSchema,
});

// Camp settings write; audited.
export const updateDocumentTypeEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/document-types/:documentTypeId',
  params: documentTypeParamsSchema,
  body: documentTypeBodySchema,
  response: documentTypeSchema,
});

// Removes a Document type and its file; Camp settings write; audited.
export const removeDocumentTypeEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/camps/:campId/document-types/:documentTypeId',
  params: documentTypeParamsSchema,
});

// Replaces the file of a Document type by an uploaded PDF, JPG or PNG, stored encrypted; a rejected file
// answers with a FileErrorCode. Camp settings write; audited.
export const setDocumentTypeFileEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/camps/:campId/document-types/:documentTypeId/file',
  params: documentTypeParamsSchema,
  upload: true,
  response: documentTypeSchema,
});

// Removes the file of a Document type; Camp settings write; audited.
export const removeDocumentTypeFileEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/camps/:campId/document-types/:documentTypeId/file',
  params: documentTypeParamsSchema,
  response: documentTypeSchema,
});

export const guardianDocumentsParamsSchema = z.object({ registrationId: z.uuid() });

export type GuardianDocumentsParams = z.infer<typeof guardianDocumentsParamsSchema>;

// What a guardian's Registration has of the Camp's Document types: the downloads for its Turnus, with
// files, and the requirements every child hands in. Empty while the Documents module is off.
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
});

export type GuardianDocuments = z.infer<typeof guardianDocumentsSchema>;

export const listGuardianDocumentsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/portal/registrations/:registrationId/documents',
  params: guardianDocumentsParamsSchema,
  response: guardianDocumentsSchema,
});
