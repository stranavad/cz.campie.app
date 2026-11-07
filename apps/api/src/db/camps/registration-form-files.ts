import * as p from 'drizzle-orm/pg-core';

import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { camps } from './camps.ts';

// Every PDF uploaded for a Camp's form declarations, so one no draft or version names can be removed.
export const registrationFormFiles = p.snakeCase.table.withRLS(
  'registration_form_files',
  {
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    fileId: p.uuid().notNull(),
    uploadedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.primaryKey({ name: 'registration_form_files_pkey', columns: [table.organisationId, table.fileId] }),
    p
      .foreignKey({
        name: 'registration_form_files_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.index('registration_form_files_camp_id_idx').on(table.campId),
    organisationPolicy(),
  ],
);
