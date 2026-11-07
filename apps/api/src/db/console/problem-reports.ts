import * as p from 'drizzle-orm/pg-core';

import { PROBLEM_REPORT_KINDS } from '@repo/schema/console';

import { id } from '../helpers/ids.ts';
import { organisations } from '../organisations/organisations.ts';

export const problemReportKind = p.pgEnum('problem_report_kind', PROBLEM_REPORT_KINDS);

// A platform table: reports reach the Platform operator, whose console has no Organisation. It holds only
// what the sender typed, the page and who sent it, never a family's records.
export const problemReports = p.snakeCase.table('problem_reports', {
  id: id(),
  kind: problemReportKind().notNull(),
  organisationId: p.uuid().references(() => organisations.id, { onDelete: 'cascade' }),
  adminId: p.uuid(),
  email: p.text(),
  pageUrl: p.text().notNull(),
  text: p.text().notNull(),
  sentAt: p.timestamp({ withTimezone: true }).notNull(),
  resolvedAt: p.timestamp({ withTimezone: true }),
});
