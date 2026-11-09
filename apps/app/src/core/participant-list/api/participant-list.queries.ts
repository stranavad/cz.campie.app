import { queryOptions, skipToken } from '@tanstack/react-query';

import type { ParticipantListQuery } from '@repo/schema/registrations';

import { participantListKeys } from '@/core/participant-list/api/participant-list.keys';
import { participantListService } from '@/core/participant-list/api/participant-list.service';

// The children of a Turnus, filtered; Registrations read. Skipped without a Turnus.
export const participantListQueryOptions = (
  organisationId: string,
  turnusId: string | null,
  filters: ParticipantListQuery,
) =>
  queryOptions({
    queryKey: participantListKeys.turnus(organisationId, turnusId, filters),
    queryFn:
      turnusId === null
        ? skipToken
        : ({ signal }) => participantListService.list(organisationId, turnusId, filters, signal),
  });
