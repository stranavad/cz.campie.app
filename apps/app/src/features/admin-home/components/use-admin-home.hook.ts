import { useAccountQuery } from '@/core/account';
import { HttpError } from '@/lib/api';

// V1 shows one Organisation per login: the admin's first membership.
export function useAdminHome() {
  const account = useAccountQuery();
  const isSignedOut = account.error instanceof HttpError && account.error.status === 401;

  return {
    isLoading: account.isPending,
    isSignedOut,
    isError: (account.isError && !isSignedOut) || account.data?.memberships.length === 0,
    organisation: account.data?.memberships[0]?.organisation,
  };
}
