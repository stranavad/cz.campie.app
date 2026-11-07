import {
  getOrganisationSettingsEndpoint,
  removeOrganisationLogoEndpoint,
  setOrganisationLogoEndpoint,
  updateOrganisationSettingsEndpoint,
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
};
