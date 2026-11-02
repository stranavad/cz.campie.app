import * as p from 'drizzle-orm/pg-core';

import { admins } from '../admins/admins.ts';

// Who is the Platform operator. The API may only read it; the operator command line writes it as the
// tables' owner.
export const operators = p.snakeCase.table('operators', {
  adminId: p
    .uuid()
    .primaryKey()
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
});
