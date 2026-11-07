import * as p from 'drizzle-orm/pg-core';

import { EMAIL_TYPES } from '@repo/schema/emails';

import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { camps } from './camps.ts';

export const emailType = p.pgEnum('email_type', EMAIL_TYPES);

// A Camp's own wording of an email type and whether it is sent; a type without a row uses the
// platform's default and is sent.
export const campEmailTexts = p.snakeCase.table.withRLS(
  'camp_email_texts',
  {
    organisationId: organisationId(),
    campId: p.uuid().notNull(),
    type: emailType().notNull(),
    subject: p.text().notNull(),
    text: p.text().notNull(),
    enabled: p.boolean().notNull(),
  },
  (table) => [
    p.primaryKey({ name: 'camp_email_texts_pkey', columns: [table.organisationId, table.campId, table.type] }),
    p
      .foreignKey({
        name: 'camp_email_texts_camps_fkey',
        columns: [table.organisationId, table.campId],
        foreignColumns: [camps.organisationId, camps.id],
      })
      .onDelete('cascade'),
    organisationPolicy(),
  ],
);
