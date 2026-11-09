import { skipToken, useQueries, useQuery } from '@tanstack/react-query';

import { campListKeys } from '@/core/camp-list/api/camp-list.keys';
import { campListService } from '@/core/camp-list/api/camp-list.service';

// The Organisation's Camps; Camp settings read.
export const useCampsQuery = (organisationId: string, enabled: boolean) =>
  useQuery({
    queryKey: campListKeys.camps(organisationId),
    queryFn: enabled ? ({ signal }) => campListService.camps(organisationId, signal) : skipToken,
  });

// A Camp's Turnusy with their places taken.
export const useTurnusyQuery = (organisationId: string, campId: string) =>
  useQuery({
    queryKey: campListKeys.campTurnusy(organisationId, campId),
    queryFn: ({ signal }) => campListService.turnusy(organisationId, campId, signal),
  });

// Every Turnus of every Camp with its places taken; Camp settings read.
export const useAllTurnusyQuery = (organisationId: string, enabled: boolean) => {
  const camps = useCampsQuery(organisationId, enabled);
  const turnusy = useQueries({
    queries: (camps.data ?? []).map((camp) => ({
      queryKey: campListKeys.campTurnusy(organisationId, camp.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => campListService.turnusy(organisationId, camp.id, signal),
    })),
  });

  return { camps: camps.data ?? [], turnusy: turnusy.flatMap((query) => query.data ?? []) };
};
