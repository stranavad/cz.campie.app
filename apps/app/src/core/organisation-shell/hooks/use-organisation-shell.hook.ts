import { useMatches } from '@tanstack/react-router';

import { usePublicOrganisationQuery } from '@/core/organisation-shell/api/public-organisation.queries';
import { HttpError } from '@/lib/api';

// What the header offers: the way to the portal on the public pages, signing out on the portal's home,
// only the Organisation on a step of a flow, and nothing on an inner portal screen, whose back header leads.
export type ShellHeaderKind = 'public' | 'portal' | 'plain' | 'none';

// The subdomain's Organisation and whether its pages can show: known, suspended by the Platform operator,
// or unknown (awaiting approval), whose pages are not public yet.
export function useOrganisationShell() {
  const organisation = usePublicOrganisationQuery();
  const code = organisation.error instanceof HttpError ? organisation.error.code : null;
  const routeId = useMatches({ select: (matches) => matches.at(-1)?.routeId });
  const header: ShellHeaderKind =
    routeId === '/organisation/' || routeId === '/organisation/$campSlug/'
      ? 'public'
      : routeId === '/organisation/portal/'
        ? 'portal'
        : routeId === '/organisation/portal/$registrationId' ||
            routeId === '/organisation/portal/$registrationId_/souhlasy' ||
            routeId === '/organisation/portal/$registrationId_/dokumenty'
          ? 'none'
          : 'plain';

  return {
    organisation: organisation.data,
    isPending: organisation.isPending,
    isSuspended: code === 'organisation_suspended',
    isUnknown: code === 'organisation_unknown',
    header,
  };
}
