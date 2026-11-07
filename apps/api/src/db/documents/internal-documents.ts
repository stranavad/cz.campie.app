import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { participants } from '../registrations/participants.ts';

// An admin's own paperwork about a child; no guardian endpoint reads this table. The file is removed
// through the file service.
export const internalDocuments = p.snakeCase.table.withRLS(
  'internal_documents',
  {
    id: id(),
    organisationId: organisationId(),
    participantId: p.uuid().notNull(),
    fileId: p.uuid().notNull(),
    uploadedByAdminId: p.uuid().notNull(),
    uploadedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p
      .foreignKey({
        name: 'internal_documents_participants_fkey',
        columns: [table.organisationId, table.participantId],
        foreignColumns: [participants.organisationId, participants.id],
      })
      .onDelete('cascade'),
    p.index('internal_documents_participant_id_idx').on(table.participantId),
    organisationPolicy(),
  ],
);
