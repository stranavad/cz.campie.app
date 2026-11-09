import { getTableName } from 'drizzle-orm';

import { adminEmailChanges } from './admins/admin-email-changes.ts';
import { admins } from './admins/admins.ts';
import { emailVerifications } from './admins/email-verifications.ts';
import { invitations } from './admins/invitations.ts';
import { memberships } from './admins/memberships.ts';
import { passwordResets } from './admins/password-resets.ts';
import { totpCredentials } from './admins/totp-credentials.ts';
import { totpRecoveryCodes } from './admins/totp-recovery-codes.ts';
import { platformAuditEntries } from './audit/platform-audit-entries.ts';
import { problemReports } from './console/problem-reports.ts';
import { mailStatistics } from './emails/mail-statistics.ts';
import { operators } from './operators/operators.ts';
import { legalAcceptances } from './organisations/legal-acceptances.ts';
import { organisationKeys } from './organisations/organisation-keys.ts';
import { organisations } from './organisations/organisations.ts';
import { supportEntries } from './organisations/support-entries.ts';
import { supportGrants } from './organisations/support-grants.ts';
import { adminSessions } from './sessions/admin-sessions.ts';

// The only tables without the organisation policy: they hold records above any one Organisation. Every
// unit of work reaches them, so their services decide who may read or change what.
export const PLATFORM_TABLES: readonly string[] = [
  organisations,
  organisationKeys,
  legalAcceptances,
  admins,
  memberships,
  invitations,
  passwordResets,
  emailVerifications,
  adminEmailChanges,
  totpCredentials,
  totpRecoveryCodes,
  operators,
  mailStatistics,
  adminSessions,
  platformAuditEntries,
  supportGrants,
  supportEntries,
  problemReports,
].map((table) => getTableName(table));
