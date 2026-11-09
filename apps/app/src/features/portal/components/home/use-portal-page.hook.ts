import { vocativeOf } from '@repo/schema/shared';

import { useGuardianRegistrationsQuery } from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';

// The portal's home: the guardian's Registrations and whom to greet.
export function usePortalPage() {
  const portal = useGuardianRegistrationsQuery();
  const firstName = portal.data?.guardian?.firstName;

  return {
    portal,
    isSignedOut: portal.error instanceof HttpError && portal.error.status === 401,
    // Addresses the guardian by first name, as Czech does; an access email has none.
    greetingName: firstName === undefined ? null : vocativeOf(firstName),
  };
}
