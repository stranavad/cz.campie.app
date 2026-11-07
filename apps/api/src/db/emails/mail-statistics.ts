import * as p from 'drizzle-orm/pg-core';

import { organisations } from '../organisations/organisations.ts';

// A platform table: counts of each Organisation's mail for the console's bounce rate, with no address.
export const mailStatistics = p.snakeCase.table('mail_statistics', {
  organisationId: p
    .uuid()
    .primaryKey()
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  sent: p.integer().notNull().default(0),
  skipped: p.integer().notNull().default(0),
  bounced: p.integer().notNull().default(0),
  complained: p.integer().notNull().default(0),
});
