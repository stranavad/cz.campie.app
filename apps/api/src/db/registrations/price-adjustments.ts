import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

// Never changed or removed, like the ledger; an erased Registration keeps them.
export const priceAdjustments = p.snakeCase.table.withRLS(
  'price_adjustments',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    amount: p.integer().notNull(),
    note: p.text().notNull(),
    createdAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.foreignKey({
      name: 'price_adjustments_registrations_fkey',
      columns: [table.organisationId, table.registrationId],
      foreignColumns: [registrations.organisationId, registrations.id],
    }),
    p.index('price_adjustments_registration_id_idx').on(table.registrationId),
    p.check('price_adjustments_amount', sql`${table.amount} <> 0`),
    organisationPolicy(),
  ],
);
