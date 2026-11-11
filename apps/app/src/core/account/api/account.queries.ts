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

// Every cached answer goes, so nothing of the Organisation's data outlives the session in this tab; the caller
// leaves for the login page, where the account is read again and answers 401.
export const useLogOutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountService.logOut,
    onSuccess: () => queryClient.clear(),
  });
};

export const useRequestEmailVerificationMutation = () =>
  useMutation({ mutationFn: accountService.requestEmailVerification });

// Ends the Platform operator's visit to an Organisation under its support grant; the account then shows it
// left, and the admin pages fall back to the admin's own Organisation, if any.
export const useLeaveSupportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountService.leaveSupport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
