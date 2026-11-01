import * as p from 'drizzle-orm/pg-core';

import { admins } from '../admins/admins.ts';
import { id } from '../helpers/ids.ts';

export const adminSessions = p.snakeCase.table('admin_sessions', {
  id: id(),
  adminId: p
    .uuid()
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  tokenHash: p.bytea().notNull().unique(),
  expiresAt: p.timestamp({ withTimezone: true }).notNull(),
});
