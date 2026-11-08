import { previewOpenItemsReminderEndpoint, sendOpenItemsReminderEndpoint } from '@repo/schema/checklist';
import {
  downloadSignedConsentEndpoint,
  getRegistrationConsentsEndpoint,
  getTurnusConsentsEndpoint,
} from '@repo/schema/consents';
import {
  addInternalDocumentEndpoint,
  approveDocumentEndpoint,
  getRegistrationDocumentsEndpoint,
  markDocumentOnPaperEndpoint,
  removeInternalDocumentEndpoint,
  returnDocumentEndpoint,
  uploadDocumentOnBehalfEndpoint,
  type ChildRequirementParams,
} from '@repo/schema/documents';
import {
  addAccessEmailEndpoint,
  addParticipantEndpoint,
  addPriceAdjustmentEndpoint,
  cancelParticipantEndpoint,
  cancelRegistrationEndpoint,
  createRegistrationEndpoint,
  editAnswersEndpoint,
  editGuardianEndpoint,
  eraseRegistrationEndpoint,
  getExportOptionsEndpoint,
  getParticipantExportEndpoint,
  getRegistrationDetailEndpoint,
  getRegistrationHistoryEndpoint,
  getTurnusFormEndpoint,
  getTurnusOverviewEndpoint,
  listParticipantsEndpoint,
  moveRegistrationEndpoint,
  previewAddParticipantEndpoint,
  previewEditAnswersEndpoint,
  previewPaymentRemindersEndpoint,
  recordPaymentEndpoint,
  regeneratePrihlaskaEndpoint,
  removeAccessEmailEndpoint,
  removeExportPresetEndpoint,
  removeGuardianEndpoint,
  saveExportPresetEndpoint,
  sendPaymentRemindersEndpoint,
  startParticipantExportEndpoint,
  startPaymentsExportEndpoint,
  verifyClaimedDiscountEndpoint,
  type AddParticipantBody,
  type AddPriceAdjustmentBody,
  type EditAnswersBody,
  type EditGuardianBody,
  type ParticipantListQuery,
  type RecordPaymentBody,
  type SaveAddParticipantBody,
  type SaveEditAnswersBody,
  type SubmitRegistrationBody,
  type VerifyClaimedDiscountBody,
} from '@repo/schema/registrations';

import { apiClient } from '@/lib/api';

export const participantsService = {
  list: (organisationId: string, turnusId: string, filters: ParticipantListQuery, signal?: AbortSignal) =>
    apiClient.request(listParticipantsEndpoint, {
      organisationId,
      params: { turnusId },
      query: {
        ...(filters.search === undefined ? {} : { search: filters.search }),
        ...(filters.paymentStatus === undefined ? {} : { paymentStatus: filters.paymentStatus }),
        ...(filters.unverifiedClaimedDiscount === true ? { unverifiedClaimedDiscount: 'true' as const } : {}),
        ...(filters.overdue === true ? { overdue: 'true' as const } : {}),
        ...(filters.unsignedConsent === true ? { unsignedConsent: 'true' as const } : {}),
        ...(filters.missingDocument === true ? { missingDocument: 'true' as const } : {}),
        ...(filters.missingAnswers === true ? { missingAnswers: 'true' as const } : {}),
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
  previewAnswers: (organisationId: string, registrationId: string, body: EditAnswersBody) =>
    apiClient.request(previewEditAnswersEndpoint, { organisationId, params: { registrationId }, body }),
  editAnswers: (organisationId: string, registrationId: string, body: SaveEditAnswersBody) =>
    apiClient.request(editAnswersEndpoint, { organisationId, params: { registrationId }, body }),
  previewParticipant: (organisationId: string, registrationId: string, body: AddParticipantBody) =>
    apiClient.request(previewAddParticipantEndpoint, { organisationId, params: { registrationId }, body }),
  addParticipant: (organisationId: string, registrationId: string, body: SaveAddParticipantBody) =>
    apiClient.request(addParticipantEndpoint, { organisationId, params: { registrationId }, body }),
  move: (organisationId: string, registrationId: string, turnusId: string) =>
    apiClient.request(moveRegistrationEndpoint, { organisationId, params: { registrationId }, body: { turnusId } }),
  editGuardian: (organisationId: string, registrationId: string, position: number, body: EditGuardianBody) =>
    apiClient.request(editGuardianEndpoint, {
      organisationId,
      params: { registrationId, position: position === 1 ? '1' : '2' },
      body,
    }),
  turnusForm: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(getTurnusFormEndpoint, { organisationId, params: { turnusId }, signal }),
  create: (organisationId: string, campId: string, body: SubmitRegistrationBody) =>
    apiClient.request(createRegistrationEndpoint, { organisationId, params: { campId }, body }),
  cancelParticipant: (organisationId: string, registrationId: string, participantId: string) =>
    apiClient.request(cancelParticipantEndpoint, { organisationId, params: { registrationId, participantId } }),
  cancelAll: (organisationId: string, registrationId: string) =>
    apiClient.request(cancelRegistrationEndpoint, { organisationId, params: { registrationId } }),
  addAccessEmail: (organisationId: string, registrationId: string, email: string) =>
    apiClient.request(addAccessEmailEndpoint, { organisationId, params: { registrationId }, body: { email } }),
  removeAccessEmail: (organisationId: string, registrationId: string, accessEmailId: string) =>
    apiClient.request(removeAccessEmailEndpoint, { organisationId, params: { registrationId, accessEmailId } }),
  removeGuardian: (organisationId: string, registrationId: string, position: number) =>
    apiClient.request(removeGuardianEndpoint, {
      organisationId,
      params: { registrationId, position: position === 1 ? '1' : '2' },
    }),
  regeneratePrihlaska: (organisationId: string, registrationId: string, participantId: string) =>
    apiClient.request(regeneratePrihlaskaEndpoint, { organisationId, params: { registrationId, participantId } }),
  startExport: (organisationId: string, turnusId: string, columns?: string[]) =>
    apiClient.request(startParticipantExportEndpoint, {
      organisationId,
      params: { turnusId },
      body: columns === undefined ? {} : { columns },
    }),
  startPaymentsExport: (organisationId: string) => apiClient.request(startPaymentsExportEndpoint, { organisationId }),
  exportOptions: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(getExportOptionsEndpoint, { organisationId, params: { turnusId }, signal }),
  savePreset: (organisationId: string, campId: string, name: string, columns: string[]) =>
    apiClient.request(saveExportPresetEndpoint, { organisationId, params: { campId }, body: { name, columns } }),
  removePreset: (organisationId: string, presetId: string) =>
    apiClient.request(removeExportPresetEndpoint, { organisationId, params: { presetId } }),
  export: (organisationId: string, exportId: string, signal?: AbortSignal) =>
    apiClient.request(getParticipantExportEndpoint, { organisationId, params: { exportId }, signal }),
  reminderPreview: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(previewPaymentRemindersEndpoint, { organisationId, params: { turnusId }, signal }),
  sendReminders: (organisationId: string, turnusId: string, overdueOnly: boolean) =>
    apiClient.request(sendPaymentRemindersEndpoint, { organisationId, params: { turnusId }, body: { overdueOnly } }),
  registrationConsents: (organisationId: string, registrationId: string, signal?: AbortSignal) =>
    apiClient.request(getRegistrationConsentsEndpoint, { organisationId, params: { registrationId }, signal }),
  turnusConsents: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(getTurnusConsentsEndpoint, { organisationId, params: { turnusId }, signal }),
  downloadSignedConsent: (organisationId: string, signatureId: string) =>
    apiClient.request(downloadSignedConsentEndpoint, { organisationId, params: { signatureId } }),
  registrationDocuments: (organisationId: string, registrationId: string, signal?: AbortSignal) =>
    apiClient.request(getRegistrationDocumentsEndpoint, { organisationId, params: { registrationId }, signal }),
  approveDocument: (organisationId: string, uploadId: string) =>
    apiClient.request(approveDocumentEndpoint, { organisationId, params: { uploadId } }),
  returnDocument: (organisationId: string, uploadId: string, note: string) =>
    apiClient.request(returnDocumentEndpoint, { organisationId, params: { uploadId }, body: { note } }),
  uploadDocumentOnBehalf: (organisationId: string, params: ChildRequirementParams, file: File) =>
    apiClient.request(uploadDocumentOnBehalfEndpoint, { organisationId, params, file }),
  markDocumentOnPaper: (organisationId: string, params: ChildRequirementParams) =>
    apiClient.request(markDocumentOnPaperEndpoint, { organisationId, params }),
  addInternalDocument: (organisationId: string, registrationId: string, participantId: string, file: File) =>
    apiClient.request(addInternalDocumentEndpoint, { organisationId, params: { registrationId, participantId }, file }),
  removeInternalDocument: (organisationId: string, internalDocumentId: string) =>
    apiClient.request(removeInternalDocumentEndpoint, { organisationId, params: { internalDocumentId } }),
  openItemsPreview: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(previewOpenItemsReminderEndpoint, { organisationId, params: { turnusId }, signal }),
  sendOpenItemsReminder: (organisationId: string, turnusId: string) =>
    apiClient.request(sendOpenItemsReminderEndpoint, { organisationId, params: { turnusId } }),
  overview: (organisationId: string, turnusId: string, signal?: AbortSignal) =>
    apiClient.request(getTurnusOverviewEndpoint, { organisationId, params: { turnusId }, signal }),
  erase: (organisationId: string, registrationId: string) =>
    apiClient.request(eraseRegistrationEndpoint, { organisationId, params: { registrationId } }),
};
