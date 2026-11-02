import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const camps = p.snakeCase.table.withRLS(
  'camps',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    name: p.text().notNull(),
    slug: p.text().notNull(),
  },
  (table) => [p.unique().on(table.organisationId, table.slug), organisationPolicy()],
);
