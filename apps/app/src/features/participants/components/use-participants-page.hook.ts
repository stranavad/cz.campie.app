import { useState } from 'react';

import type { ParticipantListQuery, ParticipantRow } from '@repo/schema/registrations';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';
import { useParticipantsQuery } from '@/features/participants/api/participants.queries';
import type {
  CheckFilter,
  InvoiceTab,
  ParticipantsPanel,
  ParticipantsSearch,
  PaymentTab,
} from '@/features/participants/components/participants-search.constant';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

const CHECK_QUERY = {
  unsignedConsent: { unsignedConsent: true },
  missingDocument: { missingDocument: true },
  missingAnswers: { missingAnswers: true },
  unverified: { unverifiedClaimedDiscount: true },
} as const satisfies Record<CheckFilter, ParticipantListQuery>;

// The tools that change Registrations, opened only by an admin who may.
const WRITE_PANELS: readonly ParticipantsPanel[] = ['reminders'];

// Whether a row belongs under a payment tab, for the tabs' counts.
const inTab = (row: ParticipantRow, tab: PaymentTab) =>
  tab === 'all' || (tab === 'overdue' ? row.overdue : row.paymentStatus === tab);

// The list's search, tab and checklist filters within the Selected Turnus, and the rows they give. The tab, the
// filters and the open tool live in the URL; the search is typed here.
export function useParticipantsPage(search: ParticipantsSearch, onSearch: (search: ParticipantsSearch) => void) {
  const { membership, isLoading, isSignedOut, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const canWrite = membershipAllows(membership, 'registrations', 'write');
  // The Turnus comes from the switcher in the page header.
  const { turnusId, turnusy, isPending: isTurnusPending, isError: isTurnusError } = useSelectedTurnus();
  const [text, setText] = useState('');
  const tab = search.platba ?? 'all';
  const checks = search.kontrola ?? [];
  const invoice = search.faktura ?? 'all';
  // A link may name a tool the admin can't use; it stays closed.
  const panel = search.panel === undefined || (!canWrite && WRITE_PANELS.includes(search.panel)) ? null : search.panel;
  const settledText = useDebouncedValue(text.trim(), 300);
  const participants = useParticipantsQuery(organisationId, turnusId, {
    ...(settledText === '' ? {} : { search: settledText }),
    ...(tab === 'all' ? {} : tab === 'overdue' ? { overdue: true } : { paymentStatus: tab }),
    ...checks.reduce<ParticipantListQuery>((query, check) => ({ ...query, ...CHECK_QUERY[check] }), {}),
    ...(invoice === 'all' ? {} : { invoice }),
  });
  // The whole Turnus, unfiltered, for the tabs' counts; the same entry as the list without filters.
  const everyone = useParticipantsQuery(organisationId, turnusId, {});
  const countOf = (of: PaymentTab) => everyone.data?.filter((row) => inTab(row, of)).length;

  return {
    isSignedOut,
    isLoading: isLoading || isTurnusPending,
    hasNoAccess: hasNoMembership || !canRead,
    organisationId,
    canWrite,
    isTurnusError,
    hasNoTurnusy: !isTurnusError && turnusy.length === 0,
    turnusId,
    campId: turnusy.find(({ id }) => id === turnusId)?.campId ?? null,
    panel,
    togglePanel: (next: ParticipantsPanel | null) =>
      onSearch({ ...search, panel: next === panel || next === null ? undefined : next }),
    text,
    setText,
    tab,
    setTab: (next: PaymentTab) => onSearch({ ...search, platba: next === 'all' ? undefined : next }),
    countOf,
    checks,
    toggleCheck: (check: CheckFilter) => {
      const next = checks.includes(check) ? checks.filter((on) => on !== check) : [...checks, check];

      onSearch({ ...search, kontrola: next.length === 0 ? undefined : next });
    },
    invoice,
    setInvoice: (next: InvoiceTab) => onSearch({ ...search, faktura: next === 'all' ? undefined : next }),
    rows: participants.data ?? [],
    isListLoading: turnusId !== null && participants.isPending,
    isEmpty: participants.data?.length === 0,
    isStale: participants.isPlaceholderData,
    isError: participants.isError,
  };
}
