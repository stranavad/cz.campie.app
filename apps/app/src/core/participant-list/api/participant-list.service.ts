import {
  listParticipantsEndpoint,
  listRecentRegistrationsEndpoint,
  type ParticipantListQuery,
} from '@repo/schema/registrations';

import { apiClient } from '@/lib/api';

export const participantListService = {
  list: (organisationId: string, turnusId: string, filters: ParticipantListQuery, signal?: AbortSignal) =>
    apiClient.request(listParticipantsEndpoint, {
      organisationId,
      params: { turnusId },
      query: {
        ...(filters.search === undefined ? {} : { search: filters.search }),
        ...(filters.paymentStatus === undefined ? {} : { paymentStatus: filters.paymentStatus }),
        ...(filters.invoice === undefined ? {} : { invoice: filters.invoice }),
        ...(filters.unverifiedClaimedDiscount === true ? { unverifiedClaimedDiscount: 'true' as const } : {}),
        ...(filters.overdue === true ? { overdue: 'true' as const } : {}),
        ...(filters.unsignedConsent === true ? { unsignedConsent: 'true' as const } : {}),
        ...(filters.missingDocument === true ? { missingDocument: 'true' as const } : {}),
        ...(filters.missingAnswers === true ? { missingAnswers: 'true' as const } : {}),
      },
      signal,
    }),
  recent: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listRecentRegistrationsEndpoint, { organisationId, signal }),
};
