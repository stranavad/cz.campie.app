import {
  getOrganisationSettingsEndpoint,
  getPaymentGatewaySettingsEndpoint,
  removeOrganisationLogoEndpoint,
  removePaymentGatewayKeysEndpoint,
  setOrganisationLogoEndpoint,
  setPaymentGatewayKeysEndpoint,
  updateOrganisationSettingsEndpoint,
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
};
