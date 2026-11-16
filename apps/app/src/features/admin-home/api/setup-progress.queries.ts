import { useQuery } from '@tanstack/react-query';

import { setupProgressKeys } from '@/features/admin-home/api/setup-progress.keys';
import { setupProgressService } from '@/features/admin-home/api/setup-progress.service';

// Camp settings read. Fetched again whenever the overview opens, so a step done elsewhere shows on return.
export const useSetupProgressQuery = (organisationId: string) =>
  useQuery({
    queryKey: setupProgressKeys.organisation(organisationId),
    queryFn: ({ signal }) => setupProgressService.get(organisationId, signal),
  });
