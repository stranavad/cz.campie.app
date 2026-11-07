import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { FILE_CONTENT_TYPES, type FileContentType } from '@repo/schema/files';

import { encrypted } from '../helpers/encrypted.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const files = p.snakeCase.table.withRLS(
  'files',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    // Text with a check rather than an enum: a spreadsheet's type is longer than an enum label may be.
    contentType: p.text().$type<FileContentType>().notNull(),
    name: encrypted().notNull(),
    size: p.integer().notNull(),
  },
  () => [
    p.check(
      'files_content_type',
      sql.raw(`content_type IN (${FILE_CONTENT_TYPES.map((type) => `'${type}'`).join(', ')})`),
    ),
    organisationPolicy(),
  ],
);
