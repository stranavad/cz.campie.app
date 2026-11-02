import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { admins } from './admins.ts';

export const passwordResets = p.snakeCase.table('password_resets', {
  id: id(),
  adminId: p
    .uuid()
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  tokenHash: p.bytea().notNull().unique(),
  expiresAt: p.timestamp({ withTimezone: true }).notNull(),
});
