import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { PAYMENT_SOURCES } from '@repo/schema/registrations';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

export const paymentSource = p.pgEnum('payment_source', PAYMENT_SOURCES);

// The ledger: the API may add and read entries but never change or remove one, and an erased Registration
// keeps them, so its foreign key never cascades.
export const payments = p.snakeCase.table.withRLS(
  'payments',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    source: paymentSource().notNull(),
    amount: p.integer().notNull(),
    paidOn: p.date({ mode: 'string' }).notNull(),
    note: p.text().notNull(),
    recordedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.foreignKey({
      name: 'payments_registrations_fkey',
      columns: [table.organisationId, table.registrationId],
      foreignColumns: [registrations.organisationId, registrations.id],
    }),
    p.index('payments_registration_id_idx').on(table.registrationId),
    p.check(
      'payments_amount',
      sql`(${table.source} = 'correction' AND ${table.amount} < 0) OR (${table.source} <> 'correction' AND ${table.amount} > 0)`,
    ),
    organisationPolicy(),
  ],
);
