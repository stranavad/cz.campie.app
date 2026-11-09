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

// A requirement over the Registered children of every Turnus of the Camp, by each child's newest document:
// Approved or handed in on paper, Pending, or nothing or Returned. The three add up to the children.
export const requirementProgressSchema = z.object({
  approved: z.number().int(),
  toReview: z.number().int(),
  missing: z.number().int(),
});

export type RequirementProgress = z.infer<typeof requirementProgressSchema>;

export const documentTypeListItemSchema = documentTypeSchema.extend({
  // Null for a download, and without Registrations read: Camp settings alone give no view of Registrations.
  progress: requirementProgressSchema.nullable(),
});

export type DocumentTypeListItem = z.infer<typeof documentTypeListItemSchema>;

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

// `document_type_turnus_unknown`: a Turnus named is not the Camp's; `document_type_in_use`: documents were
// handed in for it, so it stays.
export const DOCUMENT_TYPE_ERROR_CODES = ['document_type_turnus_unknown', 'document_type_in_use'] as const;

export type DocumentTypeErrorCode = (typeof DOCUMENT_TYPE_ERROR_CODES)[number];

// A Camp's Document types with each requirement's progress, oldest first; Camp settings read.
export const listDocumentTypesEndpoint = defineEndpoint({
  method: 'GET',
  path: '/camps/:campId/document-types',
  params: campDocumentTypesParamsSchema,
  response: z.array(documentTypeListItemSchema),
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
