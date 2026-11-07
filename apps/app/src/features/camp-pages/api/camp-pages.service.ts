import { getPublicCampEndpoint, listPublicCampsEndpoint, listPublicTurnusyEndpoint } from '@repo/schema/camps';

import { apiClient } from '@/lib/api';

export const campPagesService = {
  list: (signal?: AbortSignal) => apiClient.request(listPublicCampsEndpoint, { signal }),
  camp: (slug: string, signal?: AbortSignal) => apiClient.request(getPublicCampEndpoint, { params: { slug }, signal }),
  turnusy: (slug: string, signal?: AbortSignal) =>
    apiClient.request(listPublicTurnusyEndpoint, { params: { slug }, signal }),
};
