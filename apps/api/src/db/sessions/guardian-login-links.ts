import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const guardianLoginLinks = p.snakeCase.table.withRLS(
  'guardian_login_links',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    email: p.text().notNull(),
    tokenHash: p.bytea().notNull().unique(),
    expiresAt: p.timestamp({ withTimezone: true }).notNull(),
    usedAt: p.timestamp({ withTimezone: true }),
  },
  // A login uses up the guardian's other unused links.
  (table) => [
    p
      .index('guardian_login_links_unused_idx')
      .on(table.organisationId, table.email)
      .where(sql`${table.usedAt} IS NULL`),
    organisationPolicy(),
  ],
);
