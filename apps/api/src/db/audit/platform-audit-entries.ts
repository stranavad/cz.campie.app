import * as p from 'drizzle-orm/pg-core';

import type { ValueChange } from '../../core/audit/changes.ts';
import { id } from '../helpers/ids.ts';
import { auditActorKind } from './audit-entries.ts';

// What the Platform operator and the operator command line did above any one Organisation, such as
// approving or rejecting one. No foreign key to the target: a rejected Organisation is deleted, its
// entry stays.
export const platformAuditEntries = p.snakeCase.table('platform_audit_entries', {
  id: id(),
  occurredAt: p.timestamp({ withTimezone: true }).notNull(),
  actorKind: auditActorKind().notNull(),
  actorIdentity: p.text(),
  ipAddress: p.inet(),
  action: p.text().notNull(),
  targetType: p.text().notNull(),
  targetId: p.uuid().notNull(),
  changes: p.jsonb().$type<Record<string, ValueChange>>(),
});
