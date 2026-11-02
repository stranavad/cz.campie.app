import { useAccountQuery } from '@/core/account/api/account.queries';
import { HttpError } from '@/lib/api';

// V1 shows one Organisation per login: the admin's first membership is the one they act in.
export function useCurrentMembership() {
  const account = useAccountQuery();
  const isSignedOut = account.error instanceof HttpError && account.error.status === 401;
  const membership = account.data?.memberships[0];

  return {
    isLoading: account.isPending,
    isSignedOut,
    isError: account.isError && !isSignedOut,
    // Signed in, but a member of no Organisation, such as after being removed from the last one.
    hasNoMembership: account.isSuccess && membership === undefined,
    membership,
  };
}
