import * as p from 'drizzle-orm/pg-core';

import { adminSessions } from '../sessions/admin-sessions.ts';
import { supportGrants } from './support-grants.ts';

// A platform table: that the Platform operator's session entered an Organisation under a grant, which the
// access guard requires before anything else, so every stay under a grant is in the Organisation's log.
export const supportEntries = p.snakeCase.table(
  'support_entries',
  {
    grantId: p
      .uuid()
      .notNull()
      .references(() => supportGrants.id, { onDelete: 'cascade' }),
    sessionId: p
      .uuid()
      .notNull()
      .references(() => adminSessions.id, { onDelete: 'cascade' }),
    enteredAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [p.primaryKey({ name: 'support_entries_pkey', columns: [table.grantId, table.sessionId] })],
);
