import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { registrations } from './registrations.ts';

// A guardian's new email waiting for its link to be followed; only the token's hash is stored. A confirmed
// change keeps the previous email until its notice is sent, so no address sits in Redis.
export const guardianEmailChanges = p.snakeCase.table.withRLS(
  'guardian_email_changes',
  {
    id: id(),
    organisationId: organisationId(),
    registrationId: p.uuid().notNull(),
    position: p.integer().notNull(),
    email: p.text().notNull(),
    tokenHash: p.bytea().notNull().unique(),
    expiresAt: p.timestamp({ withTimezone: true }).notNull(),
    confirmedAt: p.timestamp({ withTimezone: true }),
    previousEmail: p.text(),
  },
  (table) => [
    // One change waits per guardian; a confirmed one stays beside it until its notice is sent.
    p
      .uniqueIndex('guardian_email_changes_waiting_key')
      .on(table.registrationId, table.position)
      .where(sql`${table.confirmedAt} IS NULL`),
    p
      .foreignKey({
        name: 'guardian_email_changes_registrations_fkey',
        columns: [table.organisationId, table.registrationId],
        foreignColumns: [registrations.organisationId, registrations.id],
      })
      .onDelete('cascade'),
    p.check('guardian_email_changes_email', sql`${table.email} = lower(${table.email})`),
    organisationPolicy(),
  ],
);
