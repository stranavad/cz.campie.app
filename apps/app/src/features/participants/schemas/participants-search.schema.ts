import { z } from 'zod';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';

// The list's payment tabs: every Registration, one payment status, or those past their due date.
export const PAYMENT_TABS = ['all', ...PAYMENT_STATUSES, 'overdue'] as const;

export type PaymentTab = (typeof PAYMENT_TABS)[number];

// The checklist filters, one at a time.
export const CHECK_FILTERS = ['unsignedConsent', 'missingDocument', 'missingAnswers', 'unverified'] as const;

export type CheckFilter = (typeof CHECK_FILTERS)[number];

// The tools opened under the page header, one at a time.
export const PARTICIPANTS_PANELS = ['reminders', 'export', 'consents'] as const;

export type ParticipantsPanel = (typeof PARTICIPANTS_PANELS)[number];

// The list's tab, filter and open tool, kept in the URL so the overview can link to them.
export const participantsSearchSchema = z.object({
  platba: z.enum(PAYMENT_TABS).optional().catch(undefined),
  kontrola: z.enum(CHECK_FILTERS).optional().catch(undefined),
  panel: z.enum(PARTICIPANTS_PANELS).optional().catch(undefined),
});

export type ParticipantsSearch = z.infer<typeof participantsSearchSchema>;
