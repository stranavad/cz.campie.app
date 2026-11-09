import type { ConsoleOrganisation } from '@repo/schema/console';

// The badge each status wears: awaiting approval asks for action, approved is live, suspended is off.
export const ORGANISATION_STATUS_BADGE = {
  pending: 'warning',
  approved: 'success',
  suspended: 'neutral',
} as const satisfies Record<ConsoleOrganisation['status'], 'warning' | 'success' | 'neutral'>;
