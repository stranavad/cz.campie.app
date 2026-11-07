import {
  getPublicCampEndpoint,
  getPublicRegistrationFormEndpoint,
  listPublicTurnusyEndpoint,
  previewPriceEndpoint,
  type PreviewPriceBody,
} from '@repo/schema/camps';

import { apiClient } from '@/lib/api';

export const registrationService = {
  camp: (slug: string, signal?: AbortSignal) => apiClient.request(getPublicCampEndpoint, { params: { slug }, signal }),
  form: (slug: string, signal?: AbortSignal) =>
    apiClient.request(getPublicRegistrationFormEndpoint, { params: { slug }, signal }),
  turnusy: (slug: string, signal?: AbortSignal) =>
    apiClient.request(listPublicTurnusyEndpoint, { params: { slug }, signal }),
  price: (slug: string, body: PreviewPriceBody, signal?: AbortSignal) =>
    apiClient.request(previewPriceEndpoint, { params: { slug }, body, signal }),
};
