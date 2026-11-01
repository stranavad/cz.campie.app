import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const guardianSessions = p.snakeCase.table.withRLS(
  'guardian_sessions',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    email: p.text().notNull(),
    tokenHash: p.bytea().notNull().unique(),
    expiresAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  () => [organisationPolicy()],
);
