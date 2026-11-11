import { useAccountQuery } from '@/core/account/api/account.queries';
import { HttpError } from '@/lib/api';

// V1 shows one Organisation at a time: the one the Platform operator is in under a support grant, ahead of
// their own, else the admin's first own membership. A support Organisation not entered from the console is
// never current, since the API refuses everything in it.
export function useCurrentMembership() {
  const account = useAccountQuery();
  const isSignedOut = account.error instanceof HttpError && account.error.status === 401;
  const memberships = account.data?.memberships ?? [];
  const membership =
    memberships.find(({ support }) => support?.entered === true) ?? memberships.find(({ support }) => support === null);

  return {
    isLoading: account.isPending,
    isSignedOut,
    isError: account.isError && !isSignedOut,
    // Signed in, but a member of no Organisation, such as after being removed from the last one.
    hasNoMembership: account.isSuccess && membership === undefined,
    membership,
  };
}
