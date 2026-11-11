import { getAccountEndpoint, logOutEndpoint, requestEmailVerificationEndpoint } from '@repo/schema/admins';
import { leaveSupportAccessEndpoint } from '@repo/schema/organisations';

import { apiClient } from '@/lib/api';

export const accountService = {
  get: (signal?: AbortSignal) => apiClient.request(getAccountEndpoint, { signal }),
  logOut: () => apiClient.request(logOutEndpoint),
  requestEmailVerification: (organisationId: string) =>
    apiClient.request(requestEmailVerificationEndpoint, { organisationId }),
  leaveSupport: (organisationId: string) => apiClient.request(leaveSupportAccessEndpoint, { organisationId }),
};
