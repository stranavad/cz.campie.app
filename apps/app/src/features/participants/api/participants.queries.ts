import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AddParticipantBody,
  AddPriceAdjustmentBody,
  CreateRegistrationBody,
  EditAnswersBody,
  EditGuardianBody,
  ParticipantListQuery,
  RecordPaymentBody,
  SaveAddParticipantBody,
  SaveEditAnswersBody,
  StartPaymentsExportBody,
  VerifyClaimedDiscountBody,
} from '@repo/schema/registrations';

import { campListKeys } from '@/core/camp-list';
import { participantListKeys, participantListQueryOptions } from '@/core/participant-list';
import { turnusOverviewKeys } from '@/core/turnus-overview';
import { participantsKeys } from '@/features/participants/api/participants.keys';
import { participantsService } from '@/features/participants/api/participants.service';

export const useParticipantsQuery = (organisationId: string, turnusId: string | null, filters: ParticipantListQuery) =>
  useQuery({ ...participantListQueryOptions(organisationId, turnusId, filters), placeholderData: keepPreviousData });

export const useRegistrationDetailQuery = (organisationId: string, registrationId: string, enabled: boolean) =>
  useQuery({
    queryKey: participantsKeys.detail(organisationId, registrationId),
    queryFn: enabled ? ({ signal }) => participantsService.detail(organisationId, registrationId, signal) : skipToken,
    retry: false,
  });

export const useRegistrationHistoryQuery = (organisationId: string, registrationId: string, enabled: boolean) =>
  useQuery({
    queryKey: participantsKeys.history(organisationId, registrationId),
    queryFn: enabled ? ({ signal }) => participantsService.history(organisationId, registrationId, signal) : skipToken,
  });

// A change to a Registration shows in its detail, history, the lists, the Turnus overview and the places taken.
const useRegistrationChange = <Variables, Result>(
  organisationId: string,
  mutationFn: (variables: Variables) => Promise<Result>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: participantsKeys.organisation(organisationId) }),
        queryClient.invalidateQueries({ queryKey: participantListKeys.organisation(organisationId) }),
        queryClient.invalidateQueries({ queryKey: turnusOverviewKeys.organisation(organisationId) }),
        queryClient.invalidateQueries({ queryKey: campListKeys.turnusy(organisationId) }),
      ]),
  });
};

export const useRecordPaymentMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (body: RecordPaymentBody) =>
    participantsService.recordPayment(organisationId, registrationId, body),
  );

export const useAddPriceAdjustmentMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (body: AddPriceAdjustmentBody) =>
    participantsService.addPriceAdjustment(organisationId, registrationId, body),
  );

export const useVerifyClaimedDiscountMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (body: VerifyClaimedDiscountBody) =>
    participantsService.verifyClaimedDiscount(organisationId, registrationId, body),
  );

export const usePreviewAnswersMutation = (organisationId: string, registrationId: string) =>
  useMutation({
    mutationFn: (body: EditAnswersBody) => participantsService.previewAnswers(organisationId, registrationId, body),
  });

export const useEditAnswersMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (body: SaveEditAnswersBody) =>
    participantsService.editAnswers(organisationId, registrationId, body),
  );

export const usePreviewParticipantMutation = (organisationId: string, registrationId: string) =>
  useMutation({
    mutationFn: (body: AddParticipantBody) =>
      participantsService.previewParticipant(organisationId, registrationId, body),
  });

export const useAddParticipantMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (body: SaveAddParticipantBody) =>
    participantsService.addParticipant(organisationId, registrationId, body),
  );

export const useMoveRegistrationMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (turnusId: string) =>
    participantsService.move(organisationId, registrationId, turnusId),
  );

export const useEditGuardianMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, ({ position, body }: { position: number; body: EditGuardianBody }) =>
    participantsService.editGuardian(organisationId, registrationId, position, body),
  );

export const useTurnusFormQuery = (organisationId: string, turnusId: string | null) =>
  useQuery({
    queryKey: [...participantsKeys.organisation(organisationId), 'form', turnusId ?? ''],
    queryFn:
      turnusId === null ? skipToken : ({ signal }) => participantsService.turnusForm(organisationId, turnusId, signal),
    retry: false,
  });

// The price of a new Registration as its answers settle; the last price stays shown while the next one loads.
export const useNewRegistrationPriceQuery = (
  organisationId: string,
  campId: string | undefined,
  body: CreateRegistrationBody | null,
) =>
  useQuery({
    queryKey: [...participantsKeys.organisation(organisationId), 'new-registration-price', campId ?? '', body],
    queryFn:
      campId === undefined || body === null
        ? skipToken
        : ({ signal }) => participantsService.previewNew(organisationId, campId, body, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });

export const useCreateRegistrationMutation = (organisationId: string) =>
  useRegistrationChange(organisationId, ({ campId, body }: { campId: string; body: CreateRegistrationBody }) =>
    participantsService.create(organisationId, campId, body),
  );

export const useCancelParticipantMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (participantId: string) =>
    participantsService.cancelParticipant(organisationId, registrationId, participantId),
  );

export const useCancelAllMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, () => participantsService.cancelAll(organisationId, registrationId));

export const useAddAccessEmailMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (email: string) =>
    participantsService.addAccessEmail(organisationId, registrationId, email),
  );

export const useClearUndeliverableMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (email: string) =>
    participantsService.clearUndeliverable(organisationId, registrationId, email),
  );

export const useRemoveAccessEmailMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (accessEmailId: string) =>
    participantsService.removeAccessEmail(organisationId, registrationId, accessEmailId),
  );

export const useRemoveGuardianMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (position: number) =>
    participantsService.removeGuardian(organisationId, registrationId, position),
  );

export const useRegeneratePrihlaskaMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, (participantId: string) =>
    participantsService.regeneratePrihlaska(organisationId, registrationId, participantId),
  );

// What an export holds: a Turnus's Participants with the columns chosen, or the payments within dates.
export type ExportRequest =
  | { kind: 'participants'; turnusId: string; columns?: string[] }
  | ({ kind: 'payments' } & Required<StartPaymentsExportBody>);

export const useStartExportMutation = (organisationId: string) =>
  useMutation({
    mutationFn: (request: ExportRequest) =>
      request.kind === 'payments'
        ? participantsService.startPaymentsExport(organisationId, { from: request.from, to: request.to })
        : participantsService.startExport(organisationId, request.turnusId, request.columns),
  });

const exportOptionsKey = (organisationId: string, turnusId: string) =>
  [...participantsKeys.organisation(organisationId), 'export-options', turnusId] as const;

export const useExportOptionsQuery = (organisationId: string, turnusId: string, enabled: boolean) =>
  useQuery({
    queryKey: exportOptionsKey(organisationId, turnusId),
    queryFn: enabled ? ({ signal }) => participantsService.exportOptions(organisationId, turnusId, signal) : skipToken,
  });

export const usePresetMutations = (organisationId: string, turnusId: string) => {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: exportOptionsKey(organisationId, turnusId) });

  return {
    save: useMutation({
      mutationFn: ({ campId, name, columns }: { campId: string; name: string; columns: string[] }) =>
        participantsService.savePreset(organisationId, campId, name, columns),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (presetId: string) => participantsService.removePreset(organisationId, presetId),
      onSuccess: refresh,
    }),
  };
};

// The job usually finishes within seconds: poll until the file is there, then renew its five-minute link.
// A job still waiting after two minutes is retrying with growing delays, so the page stops asking.
const EXPORT_POLLS = 80;

export const useParticipantExportQuery = (organisationId: string, exportId: string | null) => {
  const queryKey = [...participantsKeys.organisation(organisationId), 'export', exportId ?? ''];
  const polls = useQueryClient().getQueryState(queryKey)?.dataUpdateCount ?? 0;
  const query = useQuery({
    queryKey,
    queryFn:
      exportId === null ? skipToken : ({ signal }) => participantsService.export(organisationId, exportId, signal),
    refetchInterval: ({ state }) => {
      if (state.data?.status === 'ready') {
        return 4 * 60_000;
      }

      // Its file is gone for good; only a new export makes another.
      if (state.data?.status === 'expired') {
        return false;
      }

      return state.dataUpdateCount < EXPORT_POLLS ? 1500 : false;
    },
  });

  return { ...query, gaveUp: query.data?.status === 'pending' && polls >= EXPORT_POLLS };
};

export const usePaymentReminderPreviewQuery = (organisationId: string, turnusId: string, enabled: boolean) =>
  useQuery({
    queryKey: [...participantsKeys.organisation(organisationId), 'reminders', turnusId],
    queryFn: enabled
      ? ({ signal }) => participantsService.reminderPreview(organisationId, turnusId, signal)
      : skipToken,
  });

export const useSendRemindersMutation = (organisationId: string, turnusId: string) =>
  useMutation({
    mutationFn: (overdueOnly: boolean) => participantsService.sendReminders(organisationId, turnusId, overdueOnly),
  });

export const useRegistrationConsentsQuery = (organisationId: string, registrationId: string) =>
  useQuery({
    queryKey: [...participantsKeys.detail(organisationId, registrationId), 'consents'],
    queryFn: ({ signal }) => participantsService.registrationConsents(organisationId, registrationId, signal),
  });

export const useTurnusConsentsQuery = (organisationId: string, turnusId: string, enabled: boolean) =>
  useQuery({
    queryKey: [...participantsKeys.organisation(organisationId), 'consents', turnusId],
    queryFn: enabled ? ({ signal }) => participantsService.turnusConsents(organisationId, turnusId, signal) : skipToken,
  });

// Each download is audited, so its link is asked for at the click.
export const useDownloadSignedConsentMutation = (organisationId: string) =>
  useMutation({
    mutationFn: (signatureId: string) => participantsService.downloadSignedConsent(organisationId, signatureId),
  });

// Each opening of an Internal document is audited, so its link is asked for at the click.
export const useOpenInternalDocumentMutation = (organisationId: string) =>
  useMutation({
    mutationFn: (internalDocumentId: string) =>
      participantsService.openInternalDocument(organisationId, internalDocumentId),
  });

const documentsKey = (organisationId: string, registrationId: string) =>
  [...participantsKeys.detail(organisationId, registrationId), 'documents'] as const;

export const useRegistrationDocumentsQuery = (organisationId: string, registrationId: string) =>
  useQuery({
    queryKey: documentsKey(organisationId, registrationId),
    queryFn: ({ signal }) => participantsService.registrationDocuments(organisationId, registrationId, signal),
    // The links inside last five minutes.
    refetchInterval: 4 * 60_000,
  });

// Every review or hand-in changes the Registration's documents, the lists' document status and the documents
// waiting in the Turnus overview, which are read again.
export const useDocumentReview = <Variables, Result>(
  organisationId: string,
  registrationId: string,
  mutationFn: (variables: Variables) => Promise<Result>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    // A refusal means the page was behind, so it is read again either way.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: documentsKey(organisationId, registrationId) }),
        queryClient.invalidateQueries({ queryKey: participantListKeys.organisation(organisationId) }),
        queryClient.invalidateQueries({ queryKey: turnusOverviewKeys.organisation(organisationId) }),
      ]),
  });
};

export const useOpenItemsPreviewQuery = (organisationId: string, turnusId: string, enabled: boolean) =>
  useQuery({
    queryKey: [...participantsKeys.organisation(organisationId), 'open-items', turnusId],
    queryFn: enabled
      ? ({ signal }) => participantsService.openItemsPreview(organisationId, turnusId, signal)
      : skipToken,
  });

export const useSendOpenItemsReminderMutation = (organisationId: string, turnusId: string) =>
  useMutation({ mutationFn: () => participantsService.sendOpenItemsReminder(organisationId, turnusId) });

export const useEraseRegistrationMutation = (organisationId: string, registrationId: string) =>
  useRegistrationChange(organisationId, () => participantsService.erase(organisationId, registrationId));
