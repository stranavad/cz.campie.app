import { skipToken, useQuery } from '@tanstack/react-query';

import { turnusOverviewKeys } from '@/core/turnus-overview/api/turnus-overview.keys';
import { turnusOverviewService } from '@/core/turnus-overview/api/turnus-overview.service';

// Places and money of a Turnus; Registrations read, so the caller says whether the admin may. Skipped without an
// Organisation or a Turnus.
export const useTurnusOverviewQuery = (organisationId: string | undefined, turnusId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: turnusOverviewKeys.turnus(organisationId, turnusId),
    queryFn:
      enabled && organisationId !== undefined && turnusId !== null
        ? ({ signal }) => turnusOverviewService.get(organisationId, turnusId, signal)
        : skipToken,
  });
