import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { EXPORT_STATUSES } from '@repo/schema/registrations';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';

export const exportStatus = p.pgEnum('export_status', EXPORT_STATUSES);

// A Turnus's Participants, or the Organisation's whole payment ledger.
export const exportKind = p.pgEnum('export_kind', ['participants', 'payments']);

// An export an admin started, made by a job. No foreign keys: the admin is a platform identity, the Turnus
// may go, and the file is removed through the file service.
export const participantExports = p.snakeCase.table.withRLS(
  'participant_exports',
  {
    id: id(),
    organisationId: organisationId(),
    adminId: p.uuid().notNull(),
    kind: exportKind().notNull().default('participants'),
    // A Participant export's Turnus; null for the payments export.
    turnusId: p.uuid(),
    // The columns chosen; null for every column.
    columns: p.jsonb().$type<string[]>(),
    status: exportStatus().notNull().default('pending'),
    fileId: p.uuid(),
    createdAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    p.check('participant_exports_turnus', sql`(${table.kind} = 'participants') = (${table.turnusId} IS NOT NULL)`),
    organisationPolicy(),
  ],
);
