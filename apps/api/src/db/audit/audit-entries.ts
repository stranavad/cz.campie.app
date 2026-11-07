import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { ACTOR_KINDS } from '../../core/audit/actor.ts';
import type { ValueChange } from '../../core/audit/changes.ts';
import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';
import { organisations } from '../organisations/organisations.ts';

export const auditActorKind = p.pgEnum('audit_actor_kind', ACTOR_KINDS);

export const auditEntries = p.snakeCase.table.withRLS(
  'audit_entries',
  {
    id: id(),
    organisationId: organisationId().references(() => organisations.id, { onDelete: 'cascade' }),
    occurredAt: p.timestamp({ withTimezone: true }).notNull(),
    actorKind: auditActorKind().notNull(),
    actorIdentity: p.text(),
    ipAddress: p.inet(),
    action: p.text().notNull(),
    targetType: p.text().notNull(),
    targetId: p.uuid().notNull(),
    changes: p.jsonb().$type<Record<string, ValueChange>>(),
    encryptedFields: p
      .text()
      .array()
      .notNull()
      .default(sql`'{}'`),
  },
  // A record's history lists the entries that target it; the log browser pages an Organisation's newest first.
  (table) => [
    p.index('audit_entries_target_id_idx').on(table.targetId),
    p.index('audit_entries_organisation_id_occurred_at_idx').on(table.organisationId, table.occurredAt, table.id),
    organisationPolicy(),
  ],
);
