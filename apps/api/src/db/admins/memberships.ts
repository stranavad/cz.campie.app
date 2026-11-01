import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisations } from '../organisations/organisations.ts';
import { admins } from './admins.ts';

export const memberships = p.snakeCase.table(
  'memberships',
  {
    id: id(),
    organisationId: p
      .uuid()
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    adminId: p
      .uuid()
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
  },
  (table) => [p.unique().on(table.organisationId, table.adminId)],
);
