import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisations } from '../organisations/organisations.ts';
import { admins } from './admins.ts';

export const emailVerifications = p.snakeCase.table('email_verifications', {
  id: id(),
  adminId: p
    .uuid()
    .notNull()
    .unique()
    .references(() => admins.id, { onDelete: 'cascade' }),
  // The Organisation the admin signed up, whose log records the verification.
  organisationId: p
    .uuid()
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  tokenHash: p.bytea().notNull().unique(),
  expiresAt: p.timestamp({ withTimezone: true }).notNull(),
});
