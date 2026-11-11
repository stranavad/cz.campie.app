import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { adminSessions } from '../sessions/admin-sessions.ts';
import { supportGrants } from './support-grants.ts';

// A platform table: each visit of the Platform operator's session under a grant, open until left.
export const supportEntries = p.snakeCase.table(
  'support_entries',
  {
    id: id(),
    grantId: p
      .uuid()
      .notNull()
      .references(() => supportGrants.id, { onDelete: 'cascade' }),
    sessionId: p
      .uuid()
      .notNull()
      .references(() => adminSessions.id, { onDelete: 'cascade' }),
    enteredAt: p.timestamp({ withTimezone: true }).notNull(),
    leftAt: p.timestamp({ withTimezone: true }),
  },
  (table) => [
    p
      .uniqueIndex('support_entries_open_session_id_key')
      .on(table.sessionId)
      .where(sql`${table.leftAt} IS NULL`),
    p.index('support_entries_grant_id_idx').on(table.grantId),
  ],
);
