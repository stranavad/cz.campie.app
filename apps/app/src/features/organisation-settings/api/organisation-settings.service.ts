import { listMembersEndpoint } from '@repo/schema/admins';
import {
  getOrganisationSettingsEndpoint,
  getPaymentGatewaySettingsEndpoint,
  grantSupportAccessEndpoint,
  listAuditLogEndpoint,
  listSupportGrantsEndpoint,
  removeOrganisationLogoEndpoint,
  removePaymentGatewayKeysEndpoint,
  requireTotpEndpoint,
  revokeSupportAccessEndpoint,
  setOrganisationLogoEndpoint,
  setPaymentGatewayKeysEndpoint,
  updateOrganisationSettingsEndpoint,
  type AuditLogQuery,
  type GrantSupportAccessBody,
  type SetPaymentGatewayKeysBody,
  type UpdateOrganisationSettingsBody,
} from '@repo/schema/organisations';

import { apiClient } from '@/lib/api';

export const organisationSettingsService = {
  get: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(getOrganisationSettingsEndpoint, { organisationId, signal }),
  update: (organisationId: string, body: UpdateOrganisationSettingsBody) =>
    apiClient.request(updateOrganisationSettingsEndpoint, { organisationId, body }),
  setLogo: (organisationId: string, file: File) =>
    apiClient.request(setOrganisationLogoEndpoint, { organisationId, file }),
  requireTotp: (organisationId: string, required: boolean) =>
    apiClient.request(requireTotpEndpoint, { organisationId, body: { required } }),
  removeLogo: (organisationId: string) => apiClient.request(removeOrganisationLogoEndpoint, { organisationId }),
  members: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listMembersEndpoint, { organisationId, signal }),
  paymentGateway: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(getPaymentGatewaySettingsEndpoint, { organisationId, signal }),
  setPaymentGatewayKeys: (organisationId: string, body: SetPaymentGatewayKeysBody) =>
    apiClient.request(setPaymentGatewayKeysEndpoint, { organisationId, body }),
  removePaymentGatewayKeys: (organisationId: string) =>
    apiClient.request(removePaymentGatewayKeysEndpoint, { organisationId }),
  supportGrants: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listSupportGrantsEndpoint, { organisationId, signal }),
  grantSupport: (organisationId: string, body: GrantSupportAccessBody) =>
    apiClient.request(grantSupportAccessEndpoint, { organisationId, body }),
  revokeSupport: (organisationId: string, grantId: string) =>
    apiClient.request(revokeSupportAccessEndpoint, { organisationId, params: { grantId } }),
  auditLog: (organisationId: string, query: AuditLogQuery, signal?: AbortSignal) =>
    apiClient.request(listAuditLogEndpoint, { organisationId, query, signal }),
};
