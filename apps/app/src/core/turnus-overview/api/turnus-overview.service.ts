import { getTurnusOverviewEndpoint } from '@repo/schema/registrations';

import { apiClient } from '@/lib/api';

export const turnusOverviewService = {
  get: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(getTurnusOverviewEndpoint, { organisationId, params: { turnusId }, signal }),
};
