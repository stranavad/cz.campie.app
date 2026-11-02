import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';

export const admins = p.snakeCase.table('admins', {
  id: id(),
  email: p.text().notNull().unique(),
  // An admin invited but not yet signed in has none.
  passwordHash: p.text(),
});
