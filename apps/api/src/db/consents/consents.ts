import * as p from 'drizzle-orm/pg-core';

import { camps } from '../camps/camps.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';

export const consents = p.snakeCase.table.withRLS(
  'consents',
  {
    id: id(),
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    createdAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.unique('consents_organisation_id_id_key').on(table.organisationId, table.id),
    p
      .foreignKey({
        name: 'consents_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.index('consents_camp_id_idx').on(table.campId),
    organisationPolicy(),
  ],
);
