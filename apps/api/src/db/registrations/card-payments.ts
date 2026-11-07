import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

// A card payment started at the gateway for a Registration; the ledger records it once paid.
export const cardPayments = p.snakeCase.table.withRLS(
  'card_payments',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    transactionId: p.text().notNull(),
    amount: p.integer().notNull(),
    createdAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p
      .foreignKey({
        name: 'card_payments_registrations_fkey',
        columns: [table.organisationId, table.registrationId],
        foreignColumns: [registrations.organisationId, registrations.id],
      })
      .onDelete('cascade'),
    p.uniqueIndex('card_payments_transaction_id_key').on(table.organisationId, table.transactionId),
    organisationPolicy(),
  ],
);
