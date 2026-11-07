import { getGuardianChecklistEndpoint } from '@repo/schema/checklist';
import {
  getGuardianConsentEndpoint,
  listGuardianConsentsEndpoint,
  signConsentEndpoint,
  withdrawConsentEndpoint,
  type GuardianConsentParams,
  type SignConsentBody,
} from '@repo/schema/consents';
import {
  listGuardianDocumentsEndpoint,
  uploadDocumentEndpoint,
  type UploadDocumentParams,
} from '@repo/schema/documents';
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
  startPortalCardPaymentEndpoint,
  updateGuardianContactEndpoint,
  type AddGuardianBody,
  type AnswerNewFieldsBody,
  type GuardianContactBody,
  type RequestLoginLinkBody,
  type StartGuardianSessionBody,
  type StartPortalCardPaymentBody,
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
  startCardPayment: (registrationId: string, amount: StartPortalCardPaymentBody['amount']) =>
    apiClient.request(startPortalCardPaymentEndpoint, { params: { registrationId }, body: { amount } }),
  consents: (registrationId: string, signal?: AbortSignal) =>
    apiClient.request(listGuardianConsentsEndpoint, { params: { registrationId }, signal }),
  consent: (params: GuardianConsentParams, signal?: AbortSignal) =>
    apiClient.request(getGuardianConsentEndpoint, { params, signal }),
  signConsent: (params: GuardianConsentParams, body: SignConsentBody) =>
    apiClient.request(signConsentEndpoint, { params, body }),
  withdrawConsent: (params: GuardianConsentParams) => apiClient.request(withdrawConsentEndpoint, { params }),
  documents: (registrationId: string, signal?: AbortSignal) =>
    apiClient.request(listGuardianDocumentsEndpoint, { params: { registrationId }, signal }),
  uploadDocument: (params: UploadDocumentParams, file: File) =>
    apiClient.request(uploadDocumentEndpoint, { params, file }),
  checklist: (registrationId: string, signal?: AbortSignal) =>
    apiClient.request(getGuardianChecklistEndpoint, { params: { registrationId }, signal }),
};
