import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ParticipantListQuery } from '@repo/schema/registrations';

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
