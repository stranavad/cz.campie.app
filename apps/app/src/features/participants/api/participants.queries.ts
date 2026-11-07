import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AddPriceAdjustmentBody,
  ParticipantListQuery,
  RecordPaymentBody,
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
