import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

export const declarationAnswers = p.snakeCase.table.withRLS(
  'declaration_answers',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    declarationId: p.uuid().notNull(),
    accepted: p.boolean().notNull(),
    answeredAt: p.timestamp({ withTimezone: true }).notNull(),
    ipAddress: p.inet(),
  },
  (table) => [
    p.unique('declaration_answers_registration_id_declaration_id_key').on(table.registrationId, table.declarationId),
    p
      .foreignKey({
        name: 'declaration_answers_registrations_fkey',
        columns: [table.organisationId, table.registrationId],
        foreignColumns: [registrations.organisationId, registrations.id],
      })
      .onDelete('cascade'),
    organisationPolicy(),
  ],
);
