import * as p from 'drizzle-orm/pg-core';

import { organisations } from '../organisations/organisations.ts';

// A platform table: counts of each Organisation's mail per Prague day, for the console's bounce rate, with
// no address.
export const mailStatistics = p.snakeCase.table(
  'mail_statistics',
  {
    organisationId: p
      .uuid()
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    day: p.date({ mode: 'string' }).notNull(),
    sent: p.integer().notNull().default(0),
    skipped: p.integer().notNull().default(0),
    bounced: p.integer().notNull().default(0),
    complained: p.integer().notNull().default(0),
  },
  (table) => [p.primaryKey({ name: 'mail_statistics_pkey', columns: [table.organisationId, table.day] })],
);
