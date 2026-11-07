import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { DOCUMENT_TYPE_KINDS } from '@repo/schema/documents';

import { camps } from '../camps/camps.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';

export const documentTypeKind = p.pgEnum('document_type_kind', DOCUMENT_TYPE_KINDS);

// The file is removed through the file service, never by cascade. A download's Turnusy are checked against
// its Camp when saved; a Turnus removed later only stops matching.
export const documentTypes = p.snakeCase.table.withRLS(
  'document_types',
  {
    id: id(),
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    kind: documentTypeKind().notNull(),
    name: p.text().notNull(),
    description: p.text().notNull(),
    dueDate: p.date({ mode: 'string' }),
    turnusIds: p
      .uuid()
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    fileId: p.uuid(),
    createdAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.unique('document_types_organisation_id_id_key').on(table.organisationId, table.id),
    p
      .foreignKey({
        name: 'document_types_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.index('document_types_camp_id_idx').on(table.campId),
    p.check(
      'document_types_kind_fields',
      sql`(${table.kind} = 'requirement' OR ${table.dueDate} IS NULL) AND (${table.kind} = 'download' OR cardinality(${table.turnusIds}) = 0)`,
    ),
    organisationPolicy(),
  ],
);
