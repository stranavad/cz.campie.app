import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { PRICE_LINE_KINDS } from '@repo/schema/pricing';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { participants } from './participants.ts';
import { registrations } from './registrations.ts';

export const priceLineKind = p.pgEnum('price_line_kind', PRICE_LINE_KINDS);

export const priceLines = p.snakeCase.table.withRLS(
  'price_lines',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    position: p.integer().notNull(),
    kind: priceLineKind().notNull(),
    participantId: p.uuid(),
    label: p.text(),
    amount: p.integer().notNull(),
    // The form answer a Paid extra or Claimed discount comes from; a change of it reverses exactly these.
    fieldId: p.text(),
    optionId: p.text(),
  },
  (table) => [
    p.unique('price_lines_registration_id_position_key').on(table.registrationId, table.position),
    p
      .foreignKey({
        name: 'price_lines_registrations_fkey',
        columns: [table.organisationId, table.registrationId],
        foreignColumns: [registrations.organisationId, registrations.id],
      })
      .onDelete('cascade'),
    p
      .foreignKey({
        name: 'price_lines_participants_fkey',
        columns: [table.organisationId, table.participantId],
        foreignColumns: [participants.organisationId, participants.id],
      })
      .onDelete('cascade'),
    p.index('price_lines_participant_id_idx').on(table.participantId),
    p.check('price_lines_position', sql`${table.position} >= 0`),
    organisationPolicy(),
  ],
);
