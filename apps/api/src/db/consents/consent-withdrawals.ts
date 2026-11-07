import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { consentSignatures } from './consent-signatures.ts';

// A guardian's withdrawal of a signature, with its evidence; the signature and its PDF stay as they were.
export const consentWithdrawals = p.snakeCase.table.withRLS(
  'consent_withdrawals',
  {
    id: id(),
    organisationId: organisationId(),
    signatureId: p.uuid().notNull(),
    withdrawnByEmail: p.text().notNull(),
    ipAddress: p.text().notNull(),
    withdrawnAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p
      .foreignKey({
        name: 'consent_withdrawals_consent_signatures_fkey',
        columns: [table.organisationId, table.signatureId],
        foreignColumns: [consentSignatures.organisationId, consentSignatures.id],
      })
      .onDelete('cascade'),
    p.unique('consent_withdrawals_signature_id_key').on(table.signatureId),
    organisationPolicy(),
  ],
);
