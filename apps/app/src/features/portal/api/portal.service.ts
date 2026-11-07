import {
  addGuardianEndpoint,
  answerNewFieldsEndpoint,
  confirmGuardianEmailChangeEndpoint,
  endGuardianSessionEndpoint,
  getGuardianEditEndpoint,
  listGuardianRegistrationsEndpoint,
  requestGuardianEmailChangeEndpoint,
  requestLoginLinkEndpoint,
  startGuardianSessionEndpoint,
  updateGuardianContactEndpoint,
  type AddGuardianBody,
  type AnswerNewFieldsBody,
  type GuardianContactBody,
  type RequestLoginLinkBody,
  type StartGuardianSessionBody,
} from '@repo/schema/portal';

import { apiClient } from '@/lib/api';

export const portalService = {
  requestLink: (body: RequestLoginLinkBody) => apiClient.request(requestLoginLinkEndpoint, { body }),
  signIn: (body: StartGuardianSessionBody) => apiClient.request(startGuardianSessionEndpoint, { body }),
  signOut: () => apiClient.request(endGuardianSessionEndpoint, {}),
  registrations: (signal?: AbortSignal) => apiClient.request(listGuardianRegistrationsEndpoint, { signal }),
  edit: (registrationId: string, signal?: AbortSignal) =>
    apiClient.request(getGuardianEditEndpoint, { params: { registrationId }, signal }),
  updateContact: (registrationId: string, position: number, body: GuardianContactBody) =>
    apiClient.request(updateGuardianContactEndpoint, {
      params: { registrationId, position: position === 1 ? '1' : '2' },
      body,
    }),
  addGuardian: (registrationId: string, body: AddGuardianBody) =>
    apiClient.request(addGuardianEndpoint, { params: { registrationId }, body }),
  requestEmailChange: (registrationId: string, position: number, email: string) =>
    apiClient.request(requestGuardianEmailChangeEndpoint, {
      params: { registrationId, position: position === 1 ? '1' : '2' },
      body: { email },
    }),
  confirmEmailChange: (token: string) => apiClient.request(confirmGuardianEmailChangeEndpoint, { body: { token } }),
  answerNewFields: (registrationId: string, body: AnswerNewFieldsBody) =>
    apiClient.request(answerNewFieldsEndpoint, { params: { registrationId }, body }),
};
