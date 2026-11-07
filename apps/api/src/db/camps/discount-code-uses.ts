import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from '../registrations/registrations.ts';
import { discountCodes } from './discount-codes.ts';

// One row per Registration that used a code; counted, never a stored counter. Erasing or cancelling the
// Registration keeps its use, so its foreign key never cascades.
export const discountCodeUses = p.snakeCase.table.withRLS(
  'discount_code_uses',
  {
    id: id(),
    organisationId: organisationId(),
    discountCodeId: p.uuid().notNull(),
    registrationId: p.uuid().notNull(),
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
    p.foreignKey({
      name: 'discount_code_uses_registrations_fkey',
      columns: [table.organisationId, table.registrationId],
      foreignColumns: [registrations.organisationId, registrations.id],
    }),
    p.unique('discount_code_uses_registration_id_key').on(table.registrationId),
    p.index('discount_code_uses_discount_code_id_idx').on(table.discountCodeId),
    organisationPolicy(),
  ],
);
