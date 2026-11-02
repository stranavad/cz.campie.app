import { getPublicOrganisationEndpoint } from '@repo/schema/organisations';

import { apiClient } from '@/lib/api';

export const publicOrganisationService = {
  get: (signal?: AbortSignal) => apiClient.request(getPublicOrganisationEndpoint, { signal }),
};
