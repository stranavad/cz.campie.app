import * as p from 'drizzle-orm/pg-core';

import { FILE_CONTENT_TYPES } from '@repo/schema/files';

import { encrypted } from '../helpers/encrypted.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const fileContentType = p.pgEnum('file_content_type', FILE_CONTENT_TYPES);

export const files = p.snakeCase.table.withRLS(
  'files',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    contentType: fileContentType().notNull(),
    name: encrypted().notNull(),
    size: p.integer().notNull(),
  },
  () => [organisationPolicy()],
);
