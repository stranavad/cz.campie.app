import * as p from 'drizzle-orm/pg-core';

import { admins } from './admins.ts';

export const totpCredentials = p.snakeCase.table('totp_credentials', {
  adminId: p
    .uuid()
    .primaryKey()
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  // Sealed with the master key and bound to the admin; never filtered or sorted.
  secret: p.bytea().notNull(),
  // Null until the admin proves their app shows the right codes.
  confirmedAt: p.timestamp({ withTimezone: true }),
  // The time step of the last code accepted, so no code works twice.
  lastUsedStep: p.bigint({ mode: 'number' }),
});
