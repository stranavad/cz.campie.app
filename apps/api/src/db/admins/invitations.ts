import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisations } from '../organisations/organisations.ts';
import { admins } from './admins.ts';
import { permissionColumns } from './memberships.ts';

// A platform table like memberships: the invitee opens the link before any Organisation is current.
export const invitations = p.snakeCase.table(
  'invitations',
  {
    id: id(),
    organisationId: p
      .uuid()
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    email: p.text().notNull(),
    ...permissionColumns(),
    // Null until the job that emails the link makes its token.
    tokenHash: p.bytea().unique(),
    sentAt: p.timestamp({ withTimezone: true }).notNull(),
    expiresAt: p.timestamp({ withTimezone: true }).notNull(),
    // The Owner who last sent it; null once their account is gone.
    invitedByAdminId: p.uuid().references(() => admins.id, { onDelete: 'set null' }),
  },
  (table) => [p.unique().on(table.organisationId, table.email)],
);
