import { useState } from 'react';

import { PAYMENT_STATUSES, type PaymentStatus } from '@repo/schema/pricing';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';
import { useParticipantsQuery } from '@/features/participants/api/participants.queries';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

// The list's search and filters within the Selected Turnus, and the rows they give.
export function useParticipantsPage() {
  const { membership, isLoading, isSignedOut, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const canWrite = membershipAllows(membership, 'registrations', 'write');
  // The Turnus comes from the switcher in the admin header.
  const { turnusId, turnusy, isPending: isTurnusPending } = useSelectedTurnus();
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [unverified, setUnverified] = useState(false);
  // The checklist and payment filters, each narrowing the list when on.
  const [flags, setFlags] = useState({
    overdue: false,
    unsignedConsent: false,
    missingDocument: false,
    missingAnswers: false,
  });
  const settledSearch = useDebouncedValue(search.trim(), 300);
  const participants = useParticipantsQuery(organisationId, turnusId, {
    ...(settledSearch === '' ? {} : { search: settledSearch }),
    ...(paymentStatus === '' ? {} : { paymentStatus }),
    ...(unverified ? { unverifiedClaimedDiscount: true } : {}),
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
    turnusy,
    turnusId,
    search,
    setSearch,
    paymentStatus,
    setPaymentStatus: (value: string) => setPaymentStatus(PAYMENT_STATUSES.find((status) => status === value) ?? ''),
    unverified,
    setUnverified,
    flags,
    setFlag: (flag: keyof typeof flags, on: boolean) => setFlags({ ...flags, [flag]: on }),
    rows: participants.data ?? [],
    isEmpty: participants.data?.length === 0,
    isStale: participants.isPlaceholderData,
    isError: participants.isError,
  };
}
