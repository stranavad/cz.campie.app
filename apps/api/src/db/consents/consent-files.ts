import * as p from 'drizzle-orm/pg-core';

import { camps } from '../camps/camps.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';

// Every PDF uploaded for a Camp's Consents, with its SHA-256, so a version records the fingerprint of the
// very bytes stored.
export const consentFiles = p.snakeCase.table.withRLS(
  'consent_files',
  {
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    fileId: p.uuid().notNull(),
    sha256: p.text().notNull(),
    uploadedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.primaryKey({ name: 'consent_files_pkey', columns: [table.organisationId, table.fileId] }),
    p
      .foreignKey({
        name: 'consent_files_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.index('consent_files_camp_id_idx').on(table.campId),
    organisationPolicy(),
  ],
);
