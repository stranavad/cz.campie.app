import * as p from 'drizzle-orm/pg-core';

import { encrypted } from '../helpers/encrypted.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from './organisations.ts';

// An Organisation's own Comgate account, at most one; without it the Organisation takes no card payments.
export const paymentGatewayAccounts = p.snakeCase.table.withRLS(
  'payment_gateway_accounts',
  {
    organisationId: organisationId()
      .primaryKey()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    merchantId: p.text().notNull(),
    secret: encrypted().notNull(),
    updatedAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  () => [organisationPolicy()],
);
