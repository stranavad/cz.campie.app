import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { selectedTurnusKeys } from '@/core/selected-turnus/api/selected-turnus.keys';
import { selectedTurnusService } from '@/core/selected-turnus/api/selected-turnus.service';

export const useSelectedTurnusQuery = (organisationId: string, enabled: boolean) =>
  useQuery({
    queryKey: selectedTurnusKeys.organisation(organisationId),
    queryFn: enabled ? ({ signal }) => selectedTurnusService.get(organisationId, signal) : skipToken,
  });

export const useSelectTurnusMutation = (organisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (turnusId: string) => selectedTurnusService.select(organisationId, turnusId),
    onSuccess: (selected) => queryClient.setQueryData(selectedTurnusKeys.organisation(organisationId), selected),
  });
};
