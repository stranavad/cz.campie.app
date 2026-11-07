import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { DISCOUNT_CODE_KINDS } from '@repo/schema/pricing';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { camps } from './camps.ts';

export const discountCodeKind = p.pgEnum('discount_code_kind', DISCOUNT_CODE_KINDS);

export const discountCodes = p.snakeCase.table.withRLS(
  'discount_codes',
  {
    id: id(),
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    code: p.text().notNull(),
    kind: discountCodeKind().notNull(),
    value: p.integer().notNull(),
    usageLimit: p.integer(),
    expiresOn: p.date({ mode: 'string' }),
    active: p.boolean().notNull().default(true),
  },
  (table) => [
    p.unique('discount_codes_organisation_id_id_key').on(table.organisationId, table.id),
    p
      .foreignKey({
        name: 'discount_codes_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.uniqueIndex('discount_codes_camp_id_code_key').on(table.campId, sql`lower(${table.code})`),
    p.check('discount_codes_value', sql`${table.value} >= 1 AND (${table.kind} = 'fixed' OR ${table.value} <= 100)`),
    p.check('discount_codes_usage_limit', sql`${table.usageLimit} IS NULL OR ${table.usageLimit} >= 1`),
    organisationPolicy(),
  ],
);
