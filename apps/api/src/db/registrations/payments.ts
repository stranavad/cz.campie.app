import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { PAYERS } from '@repo/schema/pricing';
import { PAYMENT_SOURCES } from '@repo/schema/registrations';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

export const paymentSource = p.pgEnum('payment_source', PAYMENT_SOURCES);
export const payer = p.pgEnum('payer', PAYERS);

// The ledger: the API may add and read entries but never change or remove one, and an erased Registration
// keeps them, so its foreign key never cascades.
export const payments = p.snakeCase.table.withRLS(
  'payments',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    source: paymentSource().notNull(),
    payer: payer().notNull().default('guardian'),
    amount: p.integer().notNull(),
    paidOn: p.date({ mode: 'string' }).notNull(),
    note: p.text().notNull(),
    recordedAt: p.timestamp({ withTimezone: true }).notNull(),
    // The gateway's transaction, on its entries only; one entry per transaction.
    gatewayTransactionId: p.text(),
  },
  (table) => [
    p.foreignKey({
      name: 'payments_registrations_fkey',
      columns: [table.organisationId, table.registrationId],
      foreignColumns: [registrations.organisationId, registrations.id],
    }),
    p.index('payments_registration_id_idx').on(table.registrationId),
    // The payments export reads an Organisation's entries by payment date.
    p.index('payments_organisation_id_paid_on_idx').on(table.organisationId, table.paidOn),
    p.check(
      'payments_amount',
      sql`(${table.source} = 'correction' AND ${table.amount} < 0) OR (${table.source} <> 'correction' AND ${table.amount} > 0)`,
    ),
    p.check(
      'payments_gateway_transaction',
      sql`(${table.source} = 'gateway') = (${table.gatewayTransactionId} IS NOT NULL)`,
    ),
    // A card payment is always the guardian's.
    p.check('payments_gateway_payer', sql`${table.source} <> 'gateway' OR ${table.payer} = 'guardian'`),
    p
      .uniqueIndex('payments_gateway_transaction_id_key')
      .on(table.organisationId, table.gatewayTransactionId)
      .where(sql`${table.gatewayTransactionId} IS NOT NULL`),
    organisationPolicy(),
  ],
);
