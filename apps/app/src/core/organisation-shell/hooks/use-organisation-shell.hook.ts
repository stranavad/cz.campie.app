import { usePublicOrganisationQuery } from '@/core/organisation-shell/api/public-organisation.queries';
import { HttpError } from '@/lib/api';

// The subdomain's Organisation and whether its pages can show: known, suspended by the Platform operator,
// or unknown (awaiting approval), whose pages are not public yet.
export function useOrganisationShell() {
  const organisation = usePublicOrganisationQuery();
  const code = organisation.error instanceof HttpError ? organisation.error.code : null;

  return {
    organisation: organisation.data,
    isPending: organisation.isPending,
    isSuspended: code === 'organisation_suspended',
    isUnknown: code === 'organisation_unknown',
  };
}
