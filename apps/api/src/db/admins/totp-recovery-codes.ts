import * as p from 'drizzle-orm/pg-core';

import { id } from '../helpers/ids.ts';
import { admins } from './admins.ts';

// An admin's one-time recovery codes for two-step login, by their SHA-256 only.
export const totpRecoveryCodes = p.snakeCase.table(
  'totp_recovery_codes',
  {
    id: id(),
    adminId: p
      .uuid()
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    codeHash: p.text().notNull(),
    usedAt: p.timestamp({ withTimezone: true }),
  },
  (table) => [p.index('totp_recovery_codes_admin_id_idx').on(table.adminId)],
);
