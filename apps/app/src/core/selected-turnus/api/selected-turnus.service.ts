import { getSelectedTurnusEndpoint, setSelectedTurnusEndpoint } from '@repo/schema/registrations';

import { apiClient } from '@/lib/api';

export const selectedTurnusService = {
  get: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(getSelectedTurnusEndpoint, { organisationId, signal }),
  select: (organisationId: string, turnusId: string) =>
    apiClient.request(setSelectedTurnusEndpoint, { organisationId, body: { turnusId } }),
};
