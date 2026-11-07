import * as p from 'drizzle-orm/pg-core';

import { UPLOAD_STATUSES } from '@repo/schema/documents';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { participants } from '../registrations/participants.ts';
import { documentTypes } from './document-types.ts';

export const uploadStatus = p.pgEnum('upload_status', UPLOAD_STATUSES);

// A document handed in for a child's requirement. A requirement with handed-in documents is never removed,
// so its foreign key restricts; the file is removed through the file service.
export const documentUploads = p.snakeCase.table.withRLS(
  'document_uploads',
  {
    id: id(),
    organisationId: organisationId(),
    participantId: p.uuid().notNull(),
    documentTypeId: p.uuid().notNull(),
    // Null when an admin marked it handed in on paper.
    fileId: p.uuid(),
    status: uploadStatus().notNull().default('pending'),
    note: p.text(),
    // The guardian's email, or null when an admin handed it in.
    uploadedByEmail: p.text(),
    uploadedByAdminId: p.uuid(),
    uploadedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p
      .foreignKey({
        name: 'document_uploads_participants_fkey',
        columns: [table.organisationId, table.participantId],
        foreignColumns: [participants.organisationId, participants.id],
      })
      .onDelete('cascade'),
    p
      .foreignKey({
        name: 'document_uploads_document_types_fkey',
        columns: [table.organisationId, table.documentTypeId],
        foreignColumns: [documentTypes.organisationId, documentTypes.id],
      })
      .onDelete('restrict'),
    p.index('document_uploads_participant_id_idx').on(table.participantId, table.documentTypeId),
    p.index('document_uploads_document_type_id_idx').on(table.documentTypeId),
    organisationPolicy(),
  ],
);
