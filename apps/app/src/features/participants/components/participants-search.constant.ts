import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { INVOICE_FILTERS } from '@repo/schema/registrations';

// The list's payment tabs: every Registration, one payment status, or those past their due date.
export const PAYMENT_TABS = ['all', ...PAYMENT_STATUSES, 'overdue'] as const;

export type PaymentTab = (typeof PAYMENT_TABS)[number];

// The checklist filters; any number of them narrow the list together with the payment tab.
export const CHECK_FILTERS = ['unsignedConsent', 'missingDocument', 'missingAnswers', 'unverified'] as const;

export type CheckFilter = (typeof CHECK_FILTERS)[number];

// The invoice filter: every Registration, or one Invoice request state.
export const INVOICE_TABS = ['all', ...INVOICE_FILTERS] as const;

export type InvoiceTab = (typeof INVOICE_TABS)[number];

// The tools opened under the page header, one at a time.
export const PARTICIPANTS_PANELS = ['reminders', 'export', 'consents'] as const;

export type ParticipantsPanel = (typeof PARTICIPANTS_PANELS)[number];

// The list's tab, filters and open tool, kept in the URL so the overview can link to them; validated by the route.
export interface ParticipantsSearch {
  platba?: PaymentTab;
  kontrola?: readonly CheckFilter[];
  faktura?: InvoiceTab;
  panel?: ParticipantsPanel;
}
