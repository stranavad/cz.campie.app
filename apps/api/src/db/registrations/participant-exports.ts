import * as p from 'drizzle-orm/pg-core';

import { EXPORT_STATUSES } from '@repo/schema/registrations';

import { id } from '../helpers/ids.ts';
import { organisationId, organisationPolicy } from '../helpers/organisation.ts';

export const exportStatus = p.pgEnum('export_status', EXPORT_STATUSES);

// An export an admin started, made by a job. No foreign keys: the admin is a platform identity, the Turnus
// may go, and the file is removed through the file service.
export const participantExports = p.snakeCase.table.withRLS(
  'participant_exports',
  {
    id: id(),
    organisationId: organisationId(),
    adminId: p.uuid().notNull(),
    turnusId: p.uuid().notNull(),
    status: exportStatus().notNull().default('pending'),
    fileId: p.uuid(),
    createdAt: p.timestamp({ withTimezone: true }).notNull(),
  },
  () => [organisationPolicy()],
);
