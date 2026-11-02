import { queryOptions, useQuery } from '@tanstack/react-query';

import { accountKeys } from '@/core/account/api/account.keys';
import { accountService } from '@/core/account/api/account.service';

export const accountQueryOptions = () =>
  queryOptions({
    queryKey: accountKeys.all,
    queryFn: ({ signal }) => accountService.get(signal),
  });

// The signed-in admin's account; fails with a 401 HttpError without a session.
export const useAccountQuery = () => useQuery(accountQueryOptions());
