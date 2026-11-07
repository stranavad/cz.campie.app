import {
  getOrganisationSettingsEndpoint,
  getPaymentGatewaySettingsEndpoint,
  grantSupportAccessEndpoint,
  listSupportGrantsEndpoint,
  removeOrganisationLogoEndpoint,
  removePaymentGatewayKeysEndpoint,
  revokeSupportAccessEndpoint,
  setOrganisationLogoEndpoint,
  setPaymentGatewayKeysEndpoint,
  updateOrganisationSettingsEndpoint,
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
  removeLogo: (organisationId: string) => apiClient.request(removeOrganisationLogoEndpoint, { organisationId }),
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
};
