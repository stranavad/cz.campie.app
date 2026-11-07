import {
  createCampEndpoint,
  createDiscountCodeEndpoint,
  createTurnusEndpoint,
  getCampBrandingEndpoint,
  getCampEndpoint,
  getRegistrationFormEndpoint,
  listCampsEndpoint,
  listDiscountCodesEndpoint,
  listTurnusyEndpoint,
  publishRegistrationFormEndpoint,
  removeCampLogoEndpoint,
  removeDiscountCodeEndpoint,
  removeTurnusEndpoint,
  saveRegistrationFormDraftEndpoint,
  setCampLogoEndpoint,
  updateCampBrandingEndpoint,
  updateCampEndpoint,
  updateDiscountCodeEndpoint,
  updateTurnusEndpoint,
  uploadDeclarationFileEndpoint,
  type CreateCampBody,
  type CreateDiscountCodeBody,
  type SaveRegistrationFormDraftBody,
  type TurnusBody,
  type UpdateCampBody,
  type UpdateCampBrandingBody,
  type UpdateDiscountCodeBody,
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
  listDiscountCodes: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(listDiscountCodesEndpoint, { organisationId, params: { campId }, signal }),
  createDiscountCode: (organisationId: string, campId: string, body: CreateDiscountCodeBody) =>
    apiClient.request(createDiscountCodeEndpoint, { organisationId, params: { campId }, body }),
  updateDiscountCode: (organisationId: string, discountCodeId: string, body: UpdateDiscountCodeBody) =>
    apiClient.request(updateDiscountCodeEndpoint, { organisationId, params: { discountCodeId }, body }),
  removeDiscountCode: (organisationId: string, discountCodeId: string) =>
    apiClient.request(removeDiscountCodeEndpoint, { organisationId, params: { discountCodeId } }),
  getRegistrationForm: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(getRegistrationFormEndpoint, { organisationId, params: { campId }, signal }),
  saveRegistrationFormDraft: (organisationId: string, campId: string, body: SaveRegistrationFormDraftBody) =>
    apiClient.request(saveRegistrationFormDraftEndpoint, { organisationId, params: { campId }, body }),
  uploadDeclarationFile: (organisationId: string, campId: string, file: File) =>
    apiClient.request(uploadDeclarationFileEndpoint, { organisationId, params: { campId }, file }),
  publishRegistrationForm: (organisationId: string, campId: string) =>
    apiClient.request(publishRegistrationFormEndpoint, { organisationId, params: { campId } }),
  listTurnusy: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(listTurnusyEndpoint, { organisationId, params: { campId }, signal }),
  createTurnus: (organisationId: string, campId: string, body: TurnusBody) =>
    apiClient.request(createTurnusEndpoint, { organisationId, params: { campId }, body }),
  updateTurnus: (organisationId: string, turnusId: string, body: TurnusBody) =>
    apiClient.request(updateTurnusEndpoint, { organisationId, params: { turnusId }, body }),
  removeTurnus: (organisationId: string, turnusId: string) =>
    apiClient.request(removeTurnusEndpoint, { organisationId, params: { turnusId } }),
};
