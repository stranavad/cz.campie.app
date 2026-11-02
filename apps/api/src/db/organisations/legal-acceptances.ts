import * as p from 'drizzle-orm/pg-core';

import { LEGAL_DOCUMENTS } from '@repo/schema/organisations';

import { admins } from '../admins/admins.ts';
import { id } from '../helpers/ids.ts';
import { organisations } from './organisations.ts';

export const legalDocument = p.pgEnum('legal_document', LEGAL_DOCUMENTS);

// A platform table, like the Organisation it belongs to: the Platform operator reviews it before approval.
export const legalAcceptances = p.snakeCase.table('legal_acceptances', {
  id: id(),
  organisationId: p
    .uuid()
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  document: legalDocument().notNull(),
  version: p.text().notNull(),
  acceptedAt: p.timestamp({ withTimezone: true }).notNull(),
  acceptedBy: p
    .uuid()
    .notNull()
    .references(() => admins.id),
});
