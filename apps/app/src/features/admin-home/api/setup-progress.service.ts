import { getSetupProgressEndpoint } from '@repo/schema/organisations';

import { apiClient } from '@/lib/api';

export const setupProgressService = {
  get: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(getSetupProgressEndpoint, { organisationId, signal }),
};
