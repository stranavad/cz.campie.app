import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { participants } from './participants.ts';

// A Claimed discount the camp checked: one answer (a yes, or a chosen option) of one Participant.
export const claimedDiscountVerifications = p.snakeCase.table.withRLS(
  'claimed_discount_verifications',
  {
    id: id(),
    organisationId: organisationId(),
    participantId: p.uuid().notNull(),
    fieldId: p.text().notNull(),
    // Empty for a yes, which has no option.
    optionId: p.text().notNull().default(''),
    verifiedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.unique('claimed_discount_verifications_answer_key').on(table.participantId, table.fieldId, table.optionId),
    p
      .foreignKey({
        name: 'claimed_discount_verifications_participants_fkey',
        columns: [table.organisationId, table.participantId],
        foreignColumns: [participants.organisationId, participants.id],
      })
      .onDelete('cascade'),
    organisationPolicy(),
  ],
);
