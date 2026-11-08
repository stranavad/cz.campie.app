import { useState } from 'react';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useCampsQuery } from '@/features/camps/api/camps.queries';

export function useCampsPage(selectedId: string | undefined) {
  const { membership, isLoading, isSignedOut, isError, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'campSettings', 'read');
  const canWrite = membershipAllows(membership, 'campSettings', 'write');
  const camps = useCampsQuery(organisationId, canRead);
  const [isCreating, setCreating] = useState(false);
  const list = camps.data ?? [];
  // A Camp named in the address, else the first; a removed or foreign one falls back to the first too.
  const selected = list.find((camp) => camp.id === selectedId) ?? list[0];

  return {
    organisationId,
    isSignedOut,
    hasNoAccess: hasNoMembership || (membership !== undefined && !canRead),
    isLoading: isLoading || (canRead && camps.isPending),
    isError: isError || camps.isError,
    canWrite,
    camps: list,
    selected,
    isCreating,
    startCreating: () => setCreating(true),
    stopCreating: () => setCreating(false),
  };
}
