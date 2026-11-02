import { useQuery } from '@tanstack/react-query';

import { publicOrganisationKeys } from '@/core/organisation-shell/api/public-organisation.keys';
import { publicOrganisationService } from '@/core/organisation-shell/api/public-organisation.service';

// The Organisation whose subdomain this is. A suspended one answers organisation_suspended, which a
// retry would not change.
export const usePublicOrganisationQuery = () =>
  useQuery({
    queryKey: publicOrganisationKeys.all,
    queryFn: ({ signal }) => publicOrganisationService.get(signal),
    retry: false,
  });
