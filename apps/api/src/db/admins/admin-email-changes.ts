import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { admins } from './admins.ts';

// An admin's new email waiting for its link to be followed; only the token's hash is stored. A confirmed
// change keeps the previous email until its notice is sent, so no address sits in Redis.
export const adminEmailChanges = p.snakeCase.table(
  'admin_email_changes',
  {
    id: id(),
    adminId: p
      .uuid()
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    email: p.text().notNull(),
    tokenHash: p.bytea().notNull().unique(),
    expiresAt: p.timestamp({ withTimezone: true }).notNull(),
    confirmedAt: p.timestamp({ withTimezone: true }),
    previousEmail: p.text(),
  },
  (table) => [
    // One change waits per admin; a confirmed one stays beside it until its notice is sent.
    p
      .uniqueIndex('admin_email_changes_waiting_key')
      .on(table.adminId)
      .where(sql`${table.confirmedAt} IS NULL`),
    p.check('admin_email_changes_email', sql`${table.email} = lower(${table.email})`),
  ],
);
