import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { DEFAULT_DEPOSIT_DUE_DAYS } from '@repo/schema/camps';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { camps } from './camps.ts';

const date = () => p.date({ mode: 'string' });

export const turnusy = p.snakeCase.table.withRLS(
  'turnusy',
  {
    id: id(),
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    name: p.text().notNull(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    place: p.text().notNull(),
    capacity: p.integer().notNull(),
    minAge: p.integer(),
    maxAge: p.integer(),
    opensAt: p.timestamp({ withTimezone: true }),
    closesAt: p.timestamp({ withTimezone: true }),
    closedManually: p.boolean().notNull().default(false),
    websiteUrl: p.text(),
    basePrice: p.integer().notNull(),
    earlyBirdPrice: p.integer(),
    earlyBirdLastDay: date(),
    // Null when the Turnus has no Deposit; never 0.
    deposit: p.integer(),
    depositDueDays: p.integer().notNull().default(DEFAULT_DEPOSIT_DUE_DAYS),
    balanceDueDate: date(),
  },
  (table) => [
    p.unique('turnusy_organisation_id_id_key').on(table.organisationId, table.id),
    p
      .foreignKey({
        name: 'turnusy_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    p.index('turnusy_camp_id_start_date_idx').on(table.campId, table.startDate),
    p.check('turnusy_dates', sql`${table.endDate} >= ${table.startDate}`),
    p.check('turnusy_capacity', sql`${table.capacity} >= 1`),
    p.check(
      'turnusy_prices',
      sql`${table.basePrice} >= 0 AND coalesce(${table.earlyBirdPrice}, 0) >= 0 AND coalesce(${table.deposit}, 1) > 0`,
    ),
    p.check('turnusy_early_bird', sql`(${table.earlyBirdPrice} IS NULL) = (${table.earlyBirdLastDay} IS NULL)`),
    p.check(
      'turnusy_ages',
      sql`coalesce(${table.minAge}, 0) >= 0 AND coalesce(${table.minAge}, 0) <= coalesce(${table.maxAge}, 99)`,
    ),
    p.check(
      'turnusy_window',
      sql`${table.closesAt} IS NULL OR ${table.opensAt} IS NULL OR ${table.closesAt} > ${table.opensAt}`,
    ),
    p.check('turnusy_deposit_due_days', sql`${table.depositDueDays} >= 1`),
    organisationPolicy(),
  ],
);
