import { useCurrentMembership } from '@/core/account';
import { useInvitationsQuery, useMembersQuery } from '@/features/members/api/members.queries';

export function useMembersPage() {
  const { membership, isLoading, isSignedOut, isError, hasNoMembership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const isOwner = membership?.owner === true;
  const members = useMembersQuery(organisationId, isOwner);
  const invitations = useInvitationsQuery(organisationId, isOwner);

  return {
    organisationId,
    isSignedOut,
    isNotOwner: hasNoMembership || (membership !== undefined && !isOwner),
    isLoading: isLoading || (isOwner && (members.isPending || invitations.isPending)),
    isError: isError || members.isError || invitations.isError,
    members: members.data ?? [],
    invitations: invitations.data ?? [],
  };
}
