import { useAccountQuery, useCurrentMembership } from '@/core/account';

export function useAdminHome() {
  const { membership, ...state } = useCurrentMembership();
  const account = useAccountQuery();

  return {
    ...state,
    organisation: membership?.organisation,
    isOwner: membership?.owner === true,
    isOperator: account.data?.operator === true,
  };
}
