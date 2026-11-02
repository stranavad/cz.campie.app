import { useCurrentMembership } from '@/core/account';

export function useAdminHome() {
  const { membership, ...state } = useCurrentMembership();

  return { ...state, organisation: membership?.organisation, isOwner: membership?.owner === true };
}
