import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

// An address an admin gave portal access to a Registration, beyond its guardians, such as a grandparent's.
export const registrationAccessEmails = p.snakeCase.table.withRLS(
  'registration_access_emails',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    email: p.text().notNull(),
  },
  (table) => [
    p.unique('registration_access_emails_registration_id_email_key').on(table.registrationId, table.email),
    p
      .foreignKey({
        name: 'registration_access_emails_registrations_fkey',
        columns: [table.organisationId, table.registrationId],
        foreignColumns: [registrations.organisationId, registrations.id],
      })
      .onDelete('cascade'),
    p.index('registration_access_emails_organisation_id_email_idx').on(table.organisationId, table.email),
    p.check('registration_access_emails_email', sql`${table.email} = lower(${table.email})`),
    organisationPolicy(),
  ],
);
