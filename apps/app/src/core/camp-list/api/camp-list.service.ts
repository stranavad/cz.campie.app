import { listCampsEndpoint, listTurnusyEndpoint } from '@repo/schema/camps';

import { apiClient } from '@/lib/api';

export const campListService = {
  camps: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listCampsEndpoint, { organisationId, signal }),
  turnusy: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(listTurnusyEndpoint, { organisationId, params: { campId }, signal }),
};
