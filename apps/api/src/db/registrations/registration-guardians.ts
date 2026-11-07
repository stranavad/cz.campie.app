import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

export const registrationGuardians = p.snakeCase.table.withRLS(
  'registration_guardians',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    position: p.integer().notNull(),
    firstName: p.text().notNull(),
    lastName: p.text().notNull(),
    email: p.text().notNull(),
    phone: p.text(),
  },
  (table) => [
    p.unique('registration_guardians_registration_id_position_key').on(table.registrationId, table.position),
    p
      .foreignKey({
        name: 'registration_guardians_registrations_fkey',
        columns: [table.organisationId, table.registrationId],
        foreignColumns: [registrations.organisationId, registrations.id],
      })
      .onDelete('cascade'),
    p.check('registration_guardians_position', sql`${table.position} IN (1, 2)`),
    organisationPolicy(),
  ],
);
