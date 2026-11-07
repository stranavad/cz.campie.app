import {
  createCampEndpoint,
  getCampBrandingEndpoint,
  getCampEndpoint,
  listCampsEndpoint,
  removeCampLogoEndpoint,
  setCampLogoEndpoint,
  updateCampBrandingEndpoint,
  updateCampEndpoint,
  type CreateCampBody,
  type UpdateCampBody,
  type UpdateCampBrandingBody,
} from '@repo/schema/camps';

import { apiClient } from '@/lib/api';

export const campsService = {
  list: (organisationId: string, signal?: AbortSignal) =>
    apiClient.request(listCampsEndpoint, { organisationId, signal }),
  get: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(getCampEndpoint, { organisationId, params: { campId }, signal }),
  create: (organisationId: string, body: CreateCampBody) =>
    apiClient.request(createCampEndpoint, { organisationId, body }),
  update: (organisationId: string, campId: string, body: UpdateCampBody) =>
    apiClient.request(updateCampEndpoint, { organisationId, params: { campId }, body }),
  getBranding: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(getCampBrandingEndpoint, { organisationId, params: { campId }, signal }),
  updateBranding: (organisationId: string, campId: string, body: UpdateCampBrandingBody) =>
    apiClient.request(updateCampBrandingEndpoint, { organisationId, params: { campId }, body }),
  setLogo: (organisationId: string, campId: string, file: File) =>
    apiClient.request(setCampLogoEndpoint, { organisationId, params: { campId }, file }),
  removeLogo: (organisationId: string, campId: string) =>
    apiClient.request(removeCampLogoEndpoint, { organisationId, params: { campId } }),
};
