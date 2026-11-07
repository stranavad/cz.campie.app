import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisations } from './organisations.ts';

// A platform table although it names an Organisation: the access guard reads it before any Organisation's
// unit of work, to let the Platform operator in. Its services keep each Owner to their own Organisation's.
export const supportGrants = p.snakeCase.table(
  'support_grants',
  {
    id: id(),
    organisationId: p
      .uuid()
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    grantedByAdminId: p.uuid().notNull(),
    allowWrites: p.boolean().notNull(),
    grantedAt: p.timestamp({ withTimezone: true }).notNull(),
    expiresAt: p.timestamp({ withTimezone: true }).notNull(),
    revokedAt: p.timestamp({ withTimezone: true }),
  },
  (table) => [p.index('support_grants_organisation_id_idx').on(table.organisationId, table.expiresAt)],
);
