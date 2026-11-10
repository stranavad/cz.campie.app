import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

// An erased Registration keeps its Invoice request for accounting, so its foreign key never cascades.
export const invoiceRequests = p.snakeCase.table.withRLS(
  'invoice_requests',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    companyName: p.text().notNull(),
    ico: p.text().notNull(),
    dic: p.text(),
    street: p.text().notNull(),
    city: p.text().notNull(),
    postcode: p.text().notNull(),
    email: p.text(),
    note: p.text(),
    amount: p.integer().notNull(),
    invoicedOn: p.date({ mode: 'string' }),
    invoiceNumber: p.text(),
  },
  (table) => [
    p.unique('invoice_requests_organisation_id_id_key').on(table.organisationId, table.id),
    p.unique('invoice_requests_registration_id_key').on(table.registrationId),
    p.foreignKey({
      name: 'invoice_requests_registrations_fkey',
      columns: [table.organisationId, table.registrationId],
      foreignColumns: [registrations.organisationId, registrations.id],
    }),
    p.check('invoice_requests_amount', sql`${table.amount} >= 0`),
    organisationPolicy(),
  ],
);
