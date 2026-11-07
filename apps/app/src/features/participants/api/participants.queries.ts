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
