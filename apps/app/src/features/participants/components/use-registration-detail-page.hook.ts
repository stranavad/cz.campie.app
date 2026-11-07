import { membershipAllows, useCurrentMembership } from '@/core/account';
import {
  useRegistrationDetailQuery,
  useRegistrationHistoryQuery,
  useVerifyClaimedDiscountMutation,
} from '@/features/participants/api/participants.queries';

// One Registration for an admin: its detail and history, and whether they may change its money.
export function useRegistrationDetailPage(registrationId: string) {
  const { membership, isLoading, isSignedOut, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const detail = useRegistrationDetailQuery(organisationId, registrationId, canRead);
  const history = useRegistrationHistoryQuery(organisationId, registrationId, canRead);
  const verify = useVerifyClaimedDiscountMutation(organisationId, registrationId);

  return {
    organisationId,
    isSignedOut,
    isLoading: isLoading || (canRead && detail.isPending),
    hasNoAccess: hasNoMembership || !canRead,
    isError: detail.isError,
    canWrite: membershipAllows(membership, 'registrations', 'write'),
    isOwner: membership?.owner === true,
    detail: detail.data,
    history: history.data ?? [],
    verify: (participantId: string, fieldId: string, optionId: string | null) =>
      verify.mutate({ participantId, fieldId, optionId }),
    isVerifying: verify.isPending,
  };
}
