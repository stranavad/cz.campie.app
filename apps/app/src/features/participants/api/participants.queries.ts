import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AddParticipantBody,
  AddPriceAdjustmentBody,
  EditAnswersBody,
  EditGuardianBody,
  ParticipantListQuery,
  RecordPaymentBody,
  SaveAddParticipantBody,
  SaveEditAnswersBody,
  SubmitRegistrationBody,
  VerifyClaimedDiscountBody,
} from '@repo/schema/registrations';

import { participantsKeys } from '@/features/participants/api/participants.keys';
import { participantsService } from '@/features/participants/api/participants.service';

export const useSelectedTurnusQuery = (organisationId: string, enabled: boolean) =>
  useQuery({
    queryKey: participantsKeys.selectedTurnus(organisationId),
    queryFn: enabled ? ({ signal }) => participantsService.selectedTurnus(organisationId, signal) : skipToken,
  });

export const useSelectTurnusMutation = (organisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (turnusId: string) => participantsService.selectTurnus(organisationId, turnusId),
    onSuccess: (selected) => queryClient.setQueryData(participantsKeys.selectedTurnus(organisationId), selected),
  });
};

export const useParticipantsQuery = (organisationId: string, turnusId: string | null, filters: ParticipantListQuery) =>
  useQuery({
    queryKey: participantsKeys.list(organisationId, turnusId ?? '', filters),
    queryFn:
      turnusId === null
        ? skipToken
        : ({ signal }) => participantsService.list(organisationId, turnusId, filters, signal),
    placeholderData: keepPreviousData,
  });

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

// A change to a Registration's money or discounts shows in its detail, history and the list.
const useRegistrationChange = <Variables, Result>(
  organisationId: string,
  mutationFn: (variables: Variables) => Promise<Result>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantsKeys.organisation(organisationId) }),
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

export const useCreateRegistrationMutation = (organisationId: string) =>
  useRegistrationChange(organisationId, ({ campId, body }: { campId: string; body: SubmitRegistrationBody }) =>
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

export const useStartExportMutation = (organisationId: string) =>
  useMutation({ mutationFn: (turnusId: string) => participantsService.startExport(organisationId, turnusId) });

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
