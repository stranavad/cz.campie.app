import { getAccountEndpoint, logOutEndpoint } from '@repo/schema/admins';

import { apiClient } from '@/lib/api';

export const accountService = {
  get: (signal?: AbortSignal) => apiClient.request(getAccountEndpoint, { signal }),
  logOut: () => apiClient.request(logOutEndpoint),
};
