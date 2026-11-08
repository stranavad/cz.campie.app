import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '@/core/account/api/account.keys';
import { accountService } from '@/core/account/api/account.service';

export const accountQueryOptions = () =>
  queryOptions({
    queryKey: accountKeys.all,
    queryFn: ({ signal }) => accountService.get(signal),
  });

// The signed-in admin's account; fails with a 401 HttpError without a session.
export const useAccountQuery = () => useQuery(accountQueryOptions());

// Reset rather than invalidated, so the signed-out account is not kept as stale data; refetched, it
// answers 401, which pages show as signed out.
export const useLogOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountService.logOut,
    onSuccess: () => queryClient.resetQueries({ queryKey: accountKeys.all }),
  });
};

export const useRequestEmailVerificationMutation = () =>
  useMutation({ mutationFn: accountService.requestEmailVerification });
