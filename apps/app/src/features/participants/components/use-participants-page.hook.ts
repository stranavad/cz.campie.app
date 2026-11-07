import { useState } from 'react';

import { PAYMENT_STATUSES, type PaymentStatus } from '@repo/schema/pricing';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import {
  useParticipantsQuery,
  useSelectedTurnusQuery,
  useSelectTurnusMutation,
} from '@/features/participants/api/participants.queries';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value.hook';

// The list's Turnus, search and filters, and the rows they give.
export function useParticipantsPage() {
  const { membership, isLoading, isSignedOut, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const selected = useSelectedTurnusQuery(organisationId, canRead);
  const select = useSelectTurnusMutation(organisationId);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [unverified, setUnverified] = useState(false);
  const settledSearch = useDebouncedValue(search.trim(), 300);
  // The remembered Turnus, else the newest; the admin's choice is a view, not a state of the camp.
  const turnusId = selected.data?.turnusId ?? selected.data?.turnusy[0]?.id ?? null;
  const participants = useParticipantsQuery(organisationId, turnusId, {
    ...(settledSearch === '' ? {} : { search: settledSearch }),
    ...(paymentStatus === '' ? {} : { paymentStatus }),
    ...(unverified ? { unverifiedClaimedDiscount: true } : {}),
  });

  return {
    isSignedOut,
    isLoading: isLoading || (canRead && selected.isPending),
    hasNoAccess: hasNoMembership || !canRead,
    organisationId,
    turnusy: selected.data?.turnusy ?? [],
    turnusId,
    selectTurnus: (id: string) => select.mutate(id),
    search,
    setSearch,
    paymentStatus,
    setPaymentStatus: (value: string) => setPaymentStatus(PAYMENT_STATUSES.find((status) => status === value) ?? ''),
    unverified,
    setUnverified,
    rows: participants.data ?? [],
    isEmpty: participants.data?.length === 0,
    isStale: participants.isPlaceholderData,
    isError: participants.isError,
  };
}
