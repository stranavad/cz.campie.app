import { useState } from 'react';

import type { PaymentStatus } from '@repo/schema/pricing';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';
import { useParticipantsQuery } from '@/features/participants/api/participants.queries';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

// The tools opened under the page header, one at a time.
export type ParticipantsPanel = 'reminders' | 'export' | 'consents';

// The checklist and payment filters, each narrowing the list when on.
export type ParticipantFlag = 'overdue' | 'unsignedConsent' | 'missingDocument' | 'missingAnswers' | 'unverified';

// The list's search and filters within the Selected Turnus, and the rows they give.
export function useParticipantsPage() {
  const { membership, isLoading, isSignedOut, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const canWrite = membershipAllows(membership, 'registrations', 'write');
  // The Turnus comes from the switcher in the page header.
  const { turnusId, turnusy, isPending: isTurnusPending } = useSelectedTurnus();
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [panel, setPanel] = useState<ParticipantsPanel | null>(null);
  const [flags, setFlags] = useState<Record<ParticipantFlag, boolean>>({
    overdue: false,
    unsignedConsent: false,
    missingDocument: false,
    missingAnswers: false,
    unverified: false,
  });
  const settledSearch = useDebouncedValue(search.trim(), 300);
  const participants = useParticipantsQuery(organisationId, turnusId, {
    ...(settledSearch === '' ? {} : { search: settledSearch }),
    ...(paymentStatus === '' ? {} : { paymentStatus }),
    ...(flags.unverified ? { unverifiedClaimedDiscount: true } : {}),
    ...(flags.overdue ? { overdue: true } : {}),
    ...(flags.unsignedConsent ? { unsignedConsent: true } : {}),
    ...(flags.missingDocument ? { missingDocument: true } : {}),
    ...(flags.missingAnswers ? { missingAnswers: true } : {}),
  });

  return {
    isSignedOut,
    isLoading: isLoading || isTurnusPending,
    hasNoAccess: hasNoMembership || !canRead,
    organisationId,
    canWrite,
    hasNoTurnusy: turnusy.length === 0,
    turnusId,
    campId: turnusy.find(({ id }) => id === turnusId)?.campId ?? null,
    panel,
    togglePanel: (next: ParticipantsPanel | null) => setPanel(next === panel ? null : next),
    search,
    setSearch,
    paymentStatus,
    setPaymentStatus,
    flags,
    toggleFlag: (flag: ParticipantFlag) => setFlags({ ...flags, [flag]: !flags[flag] }),
    rows: participants.data ?? [],
    isListLoading: turnusId !== null && participants.isPending,
    isEmpty: participants.data?.length === 0,
    isStale: participants.isPlaceholderData,
    isError: participants.isError,
  };
}
