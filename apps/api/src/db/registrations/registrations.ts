import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import type { Answers } from '@repo/schema/form-engine';
import { PAYMENT_CHOICES } from '@repo/schema/pricing';

import { registrationFormVersions } from '../camps/registration-form-versions.ts';
import { turnusy } from '../camps/turnusy.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';

export const paymentChoice = p.pgEnum('payment_choice', PAYMENT_CHOICES);

export const registrations = p.snakeCase.table.withRLS(
  'registrations',
  {
    id: id(),
    organisationId: organisationId(),
    turnusId: p.uuid().notNull(),
    formVersionId: p.uuid().notNull(),
    variableSymbol: p.text().notNull(),
    idempotencyKey: p.uuid().notNull(),
    paymentChoice: paymentChoice().notNull(),
    depositTotal: p.integer(),
    answers: p.jsonb().$type<Answers>().notNull().default({}),
    submittedAt: p.timestamp({ withTimezone: true }).notNull(),
    // When the Owner erased it to an accounting tombstone; null for a Registration with its data.
    erasedAt: p.timestamp({ withTimezone: true }),
  },
  (table) => [
    p.unique('registrations_organisation_id_id_key').on(table.organisationId, table.id),
    p.unique('registrations_organisation_id_variable_symbol_key').on(table.organisationId, table.variableSymbol),
    p.unique('registrations_organisation_id_idempotency_key_key').on(table.organisationId, table.idempotencyKey),
    // A Turnus or form version with Registrations is never removed.
    p.foreignKey({
      name: 'registrations_turnusy_fkey',
      columns: [table.organisationId, table.turnusId],
      foreignColumns: [turnusy.organisationId, turnusy.id],
    }),
    p.foreignKey({
      name: 'registrations_registration_form_versions_fkey',
      columns: [table.organisationId, table.formVersionId],
      foreignColumns: [registrationFormVersions.organisationId, registrationFormVersions.id],
    }),
    p.index('registrations_turnus_id_idx').on(table.turnusId),
    p.check('registrations_variable_symbol', sql`${table.variableSymbol} ~ '^[0-9]{8}$'`),
    p.check('registrations_deposit_total', sql`coalesce(${table.depositTotal}, 0) >= 0`),
    organisationPolicy(),
  ],
);
