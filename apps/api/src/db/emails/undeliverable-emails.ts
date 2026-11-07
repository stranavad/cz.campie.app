import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { UNDELIVERABLE_REASONS } from '@repo/schema/emails';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const undeliverableReason = p.pgEnum('undeliverable_reason', UNDELIVERABLE_REASONS);

// An address of the Organisation's mail that the provider reported undeliverable.
export const undeliverableEmails = p.snakeCase.table.withRLS(
  'undeliverable_emails',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    email: p.text().notNull(),
    reason: undeliverableReason().notNull(),
    markedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.unique('undeliverable_emails_organisation_id_email_key').on(table.organisationId, table.email),
    p.check('undeliverable_emails_email', sql`${table.email} = lower(${table.email})`),
    organisationPolicy(),
  ],
);
