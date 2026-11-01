import * as p from 'drizzle-orm/pg-core';

import { organisations } from './organisations.ts';

// A platform table although it names an Organisation: the key is created with its Organisation, in a
// platform unit of work.
export const organisationKeys = p.snakeCase.table('organisation_keys', {
  organisationId: p
    .uuid()
    .primaryKey()
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  wrappedKey: p.bytea().notNull(),
});
