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
  previewCampEndpoint,
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
import {
  createConsentEndpoint,
  getConsentEndpoint,
  listConsentsEndpoint,
  publishConsentEndpoint,
  uploadConsentFileEndpoint,
  type ConsentContent,
} from '@repo/schema/consents';
import {
  createDocumentTypeEndpoint,
  listDocumentTypesEndpoint,
  removeDocumentTypeEndpoint,
  removeDocumentTypeFileEndpoint,
  setDocumentTypeFileEndpoint,
  updateDocumentTypeEndpoint,
  type DocumentTypeBody,
} from '@repo/schema/documents';
import {
  listCampEmailTextsEndpoint,
  previewCampEmailTextEndpoint,
  resetCampEmailTextEndpoint,
  saveCampEmailTextEndpoint,
  type CampEmailTextBody,
  type EmailType,
} from '@repo/schema/emails';

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
  preview: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(previewCampEndpoint, { organisationId, params: { campId }, signal }),
  listEmailTexts: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(listCampEmailTextsEndpoint, { organisationId, params: { campId }, signal }),
  saveEmailText: (organisationId: string, campId: string, type: EmailType, body: CampEmailTextBody) =>
    apiClient.request(saveCampEmailTextEndpoint, { organisationId, params: { campId, type }, body }),
  resetEmailText: (organisationId: string, campId: string, type: EmailType) =>
    apiClient.request(resetCampEmailTextEndpoint, { organisationId, params: { campId, type } }),
  previewEmailText: (
    organisationId: string,
    campId: string,
    type: EmailType,
    body: Pick<CampEmailTextBody, 'subject' | 'text'>,
  ) => apiClient.request(previewCampEmailTextEndpoint, { organisationId, params: { campId, type }, body }),
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
  consents: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(listConsentsEndpoint, { organisationId, params: { campId }, signal }),
  consent: (organisationId: string, campId: string, consentId: string, signal?: AbortSignal) =>
    apiClient.request(getConsentEndpoint, { organisationId, params: { campId, consentId }, signal }),
  createConsent: (organisationId: string, campId: string, body: ConsentContent) =>
    apiClient.request(createConsentEndpoint, { organisationId, params: { campId }, body }),
  publishConsent: (organisationId: string, campId: string, consentId: string, body: ConsentContent) =>
    apiClient.request(publishConsentEndpoint, { organisationId, params: { campId, consentId }, body }),
  uploadConsentFile: (organisationId: string, campId: string, file: File) =>
    apiClient.request(uploadConsentFileEndpoint, { organisationId, params: { campId }, file }),
  documentTypes: (organisationId: string, campId: string, signal?: AbortSignal) =>
    apiClient.request(listDocumentTypesEndpoint, { organisationId, params: { campId }, signal }),
  createDocumentType: (organisationId: string, campId: string, body: DocumentTypeBody) =>
    apiClient.request(createDocumentTypeEndpoint, { organisationId, params: { campId }, body }),
  updateDocumentType: (organisationId: string, campId: string, documentTypeId: string, body: DocumentTypeBody) =>
    apiClient.request(updateDocumentTypeEndpoint, { organisationId, params: { campId, documentTypeId }, body }),
  removeDocumentType: (organisationId: string, campId: string, documentTypeId: string) =>
    apiClient.request(removeDocumentTypeEndpoint, { organisationId, params: { campId, documentTypeId } }),
  setDocumentTypeFile: (organisationId: string, campId: string, documentTypeId: string, file: File) =>
    apiClient.request(setDocumentTypeFileEndpoint, { organisationId, params: { campId, documentTypeId }, file }),
  removeDocumentTypeFile: (organisationId: string, campId: string, documentTypeId: string) =>
    apiClient.request(removeDocumentTypeFileEndpoint, { organisationId, params: { campId, documentTypeId } }),
};
