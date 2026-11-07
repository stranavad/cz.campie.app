import {
  getSelectedTurnusEndpoint,
  listParticipantsEndpoint,
  setSelectedTurnusEndpoint,
  type ParticipantListQuery,
} from '@repo/schema/registrations';

import { apiClient } from '@/lib/api';

export const participantsService = {
  selectedTurnus: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(getSelectedTurnusEndpoint, { organisationId, signal }),
  selectTurnus: (organisationId: string, turnusId: string) =>
    apiClient.request(setSelectedTurnusEndpoint, { organisationId, body: { turnusId } }),
  list: (organisationId: string, turnusId: string, filters: ParticipantListQuery, signal?: AbortSignal) =>
    apiClient.request(listParticipantsEndpoint, {
      organisationId,
      params: { turnusId },
      query: {
        ...(filters.search === undefined ? {} : { search: filters.search }),
        ...(filters.paymentStatus === undefined ? {} : { paymentStatus: filters.paymentStatus }),
        ...(filters.unverifiedClaimedDiscount === true ? { unverifiedClaimedDiscount: 'true' as const } : {}),
      },
      signal,
    }),
};
