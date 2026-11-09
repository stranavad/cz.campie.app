import { skipToken, useQueries, useQuery } from '@tanstack/react-query';

import { adminHomeKeys } from '@/features/admin-home/api/admin-home.keys';
import { adminHomeService } from '@/features/admin-home/api/admin-home.service';

// Every child of the Turnus, for the checklist counts; Registrations read.
export const useTurnusParticipantsQuery = (organisationId: string, turnusId: string | null) =>
  useQuery({
    queryKey: adminHomeKeys.participants(organisationId, turnusId ?? ''),
    queryFn:
      turnusId === null ? skipToken : ({ signal }) => adminHomeService.participants(organisationId, turnusId, signal),
  });

// Every Turnus of every Camp with its places taken; Camp settings read.
export const useAllTurnusyQuery = (organisationId: string, enabled: boolean) => {
  const camps = useQuery({
    queryKey: adminHomeKeys.camps(organisationId),
    queryFn: enabled ? ({ signal }) => adminHomeService.camps(organisationId, signal) : skipToken,
  });
  const turnusy = useQueries({
    queries: (camps.data ?? []).map((camp) => ({
      queryKey: adminHomeKeys.turnusy(organisationId, camp.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => adminHomeService.turnusy(organisationId, camp.id, signal),
    })),
  });

  return { camps: camps.data ?? [], turnusy: turnusy.flatMap((query) => query.data ?? []) };
};
