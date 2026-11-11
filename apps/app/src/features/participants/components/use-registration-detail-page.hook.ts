import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';
import {
  useRegeneratePrihlaskaMutation,
  useRegistrationDetailQuery,
  useRegistrationHistoryQuery,
  useVerifyClaimedDiscountMutation,
} from '@/features/participants/api/participants.queries';

// One Registration for an admin: its detail and history, and what they may change on it.
export function useRegistrationDetailPage(registrationId: string) {
  const { t } = useTranslation('participants');
  const { membership, isLoading, isSignedOut, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const detail = useRegistrationDetailQuery(organisationId, registrationId, canRead);
  const history = useRegistrationHistoryQuery(organisationId, registrationId, canRead);
  const verify = useVerifyClaimedDiscountMutation(organisationId, registrationId);
  const regenerate = useRegeneratePrihlaskaMutation(organisationId, registrationId);
  const { turnusy } = useSelectedTurnus();
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
    canWrite: membershipAllows(membership, 'registrations', 'write'),
    canWriteHealth: membershipAllows(membership, 'health', 'write'),
    // Erasure is the Owner's, while there is anything left to erase.
    canErase: membership?.owner === true && (detail.data?.guardians.length ?? 0) > 0,
    // The Camp's other Turnusy, to move the Registration to.
    others: turnusy.filter(({ id, campId }) => campId === detail.data?.camp.id && id !== detail.data.turnus.id),
    detail: detail.data,
    title: names.length === 0 ? t('detail.title', { symbol: detail.data?.variableSymbol ?? '' }) : names.join(', '),
    history: history.data ?? [],
    isEditing,
    toggleEditing: () => setEditing(!isEditing),
    verify: (participantId: string, fieldId: string, optionId: string | null) =>
      verify.mutate({ participantId, fieldId, optionId }),
    isVerifying: verify.isPending,
    regenerate: (participantId: string) => regenerate.mutate(participantId),
    isRegenerating: regenerate.isSuccess,
  };
}
