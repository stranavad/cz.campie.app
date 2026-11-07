import * as p from 'drizzle-orm/pg-core';

import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { camps } from './camps.ts';

// Every slug a Camp has had, its current one included: a former one keeps leading to it, and no other
// Camp of the Organisation can take it.
export const campSlugs = p.snakeCase.table.withRLS(
  'camp_slugs',
  {
    organisationId: organisationId(),
    slug: p.text().notNull(),
    campId: p.uuid().notNull(),
  },
  (table) => [
    p.primaryKey({ name: 'camp_slugs_pkey', columns: [table.organisationId, table.slug] }),
    p
      .foreignKey({
        name: 'camp_slugs_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    organisationPolicy(),
  ],
);
