import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';

export const admins = p.snakeCase.table('admins', {
  id: id(),
  email: p.text().notNull().unique(),
  // An admin invited but not yet signed in has none.
  passwordHash: p.text(),
  // Null until the admin proves the email is theirs: until then whoever opens an invitation or a reset
  // link sent to it may take the account over.
  emailVerifiedAt: p.timestamp({ withTimezone: true }),
  // Null for an admin who has not given it yet, whom every view names by email instead.
  firstName: p.text(),
  lastName: p.text(),
});
