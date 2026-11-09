import { skipToken, useQuery } from '@tanstack/react-query';

import { turnusOverviewKeys } from '@/core/turnus-overview/api/turnus-overview.keys';
import { turnusOverviewService } from '@/core/turnus-overview/api/turnus-overview.service';

// Places and money of a Turnus; Registrations read.
export const useTurnusOverviewQuery = (organisationId: string, turnusId: string | null) =>
  useQuery({
    queryKey: turnusOverviewKeys.turnus(organisationId, turnusId ?? ''),
    queryFn:
      turnusId === null ? skipToken : ({ signal }) => turnusOverviewService.get(organisationId, turnusId, signal),
  });
