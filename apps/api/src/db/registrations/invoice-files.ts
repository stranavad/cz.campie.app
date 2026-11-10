import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { invoiceRequests } from './invoice-requests.ts';

// Accounting documents: only ever added, so the foreign key never cascades, and neither cleanup nor erasure
// removes a row or its file.
export const invoiceFiles = p.snakeCase.table.withRLS(
  'invoice_files',
  {
    id: id(),
    organisationId: organisationId(),
    invoiceRequestId: p.uuid().notNull(),
    fileId: p.uuid().notNull(),
    uploadedByAdminId: p.uuid().notNull(),
    uploadedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.foreignKey({
      name: 'invoice_files_invoice_requests_fkey',
      columns: [table.organisationId, table.invoiceRequestId],
      foreignColumns: [invoiceRequests.organisationId, invoiceRequests.id],
    }),
    p.index('invoice_files_invoice_request_id_idx').on(table.invoiceRequestId),
    organisationPolicy(),
  ],
);
