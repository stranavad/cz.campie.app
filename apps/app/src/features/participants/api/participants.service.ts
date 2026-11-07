import {
  addPriceAdjustmentEndpoint,
  getRegistrationDetailEndpoint,
  getRegistrationHistoryEndpoint,
  getSelectedTurnusEndpoint,
  listParticipantsEndpoint,
  recordPaymentEndpoint,
  setSelectedTurnusEndpoint,
  verifyClaimedDiscountEndpoint,
  type AddPriceAdjustmentBody,
  type ParticipantListQuery,
  type RecordPaymentBody,
  type VerifyClaimedDiscountBody,
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
  detail: (organisationId: string, registrationId: string, signal?: AbortSignal) =>
    apiClient.request(getRegistrationDetailEndpoint, { organisationId, params: { registrationId }, signal }),
  history: (organisationId: string, registrationId: string, signal?: AbortSignal) =>
    apiClient.request(getRegistrationHistoryEndpoint, { organisationId, params: { registrationId }, signal }),
  recordPayment: (organisationId: string, registrationId: string, body: RecordPaymentBody) =>
    apiClient.request(recordPaymentEndpoint, { organisationId, params: { registrationId }, body }),
  addPriceAdjustment: (organisationId: string, registrationId: string, body: AddPriceAdjustmentBody) =>
    apiClient.request(addPriceAdjustmentEndpoint, { organisationId, params: { registrationId }, body }),
  verifyClaimedDiscount: (organisationId: string, registrationId: string, body: VerifyClaimedDiscountBody) =>
    apiClient.request(verifyClaimedDiscountEndpoint, { organisationId, params: { registrationId }, body }),
};
