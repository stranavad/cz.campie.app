import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import {
  useRegistrationDetailQuery,
  useRegistrationHistoryQuery,
  useVerifyClaimedDiscountMutation,
} from '@/features/participants/api/participants.queries';

// One Registration for an admin: its detail and history, and whether they may change its money.
export function useRegistrationDetailPage(registrationId: string) {
  const { t } = useTranslation('participants');
  const { membership, isLoading, isSignedOut, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const detail = useRegistrationDetailQuery(organisationId, registrationId, canRead);
  const history = useRegistrationHistoryQuery(organisationId, registrationId, canRead);
  const verify = useVerifyClaimedDiscountMutation(organisationId, registrationId);
  // The editors open from the header, so reading the Registration is not a wall of inputs.
  const [isEditing, setEditing] = useState(false);
  // The children by name; an erased Registration has none left, so it goes by its Variable symbol.
  const names = (detail.data?.participants ?? [])
    .map((participant) => t('name', { first: participant.firstName, last: participant.lastName }).trim())
    .filter((name) => name !== '');

  return {
    organisationId,
    isSignedOut,
    isLoading: isLoading || (canRead && detail.isPending),
    hasNoAccess: hasNoMembership || !canRead,
    isError: detail.isError,
    canWrite: membershipAllows(membership, 'registrations', 'write'),
    canWriteHealth: membershipAllows(membership, 'health', 'write'),
    isOwner: membership?.owner === true,
    detail: detail.data,
    title: names.length === 0 ? t('detail.title', { symbol: detail.data?.variableSymbol ?? '' }) : names.join(', '),
    history: history.data ?? [],
    isEditing,
    toggleEditing: () => setEditing(!isEditing),
    verify: (participantId: string, fieldId: string, optionId: string | null) =>
      verify.mutate({ participantId, fieldId, optionId }),
    isVerifying: verify.isPending,
  };
}
