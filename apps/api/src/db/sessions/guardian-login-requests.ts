import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

// A request for a login link, kept until its job looks the email up: every request takes the same path,
// whether or not the email is a guardian's, so its timing tells nothing, and the email stays out of Redis.
export const guardianLoginRequests = p.snakeCase.table.withRLS(
  'guardian_login_requests',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    email: p.text().notNull(),
  },
  (table) => [
    p.check('guardian_login_requests_email', sql`${table.email} = lower(${table.email})`),
    organisationPolicy(),
  ],
);
