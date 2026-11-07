import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { discountCodes } from './discount-codes.ts';

// One row per Registration that used a code; counted, never a stored counter.
export const discountCodeUses = p.snakeCase.table.withRLS(
  'discount_code_uses',
  {
    id: id(),
    organisationId: organisationId(),
    discountCodeId: p.uuid().notNull(),
    usedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p
      .foreignKey({
        name: 'discount_code_uses_discount_codes_fkey',
        columns: [table.organisationId, table.discountCodeId],
        foreignColumns: [discountCodes.organisationId, discountCodes.id],
      })
      .onDelete('cascade'),
    p.index('discount_code_uses_discount_code_id_idx').on(table.discountCodeId),
    organisationPolicy(),
  ],
);
