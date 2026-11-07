import { membershipAllows, useAccountQuery, useCurrentMembership } from '@/core/account';

export function useAdminHome() {
  const { membership, ...state } = useCurrentMembership();
  const account = useAccountQuery();

  return {
    ...state,
    organisation: membership?.organisation,
    isOwner: membership?.owner === true,
    canSeeCamps: membershipAllows(membership, 'campSettings', 'read'),
    canSeeRegistrations: membershipAllows(membership, 'registrations', 'read'),
    isOperator: account.data?.operator === true,
  };
}
