import { vocativeOf } from '@repo/schema/admins';

import { membershipAllows, useAccountQuery, useCurrentMembership } from '@/core/account';
import { useSelectedTurnus } from '@/core/selected-turnus';

// The overview's frame: whose Organisation, which Turnus, and which panels this admin may see.
export function useAdminHome() {
  const { membership, ...state } = useCurrentMembership();
  const account = useAccountQuery();
  const { turnusId, turnusy } = useSelectedTurnus();
  const canReadRegistrations = membershipAllows(membership, 'registrations', 'read');
  const canReadCamps = membershipAllows(membership, 'campSettings', 'read');
  const firstName = account.data?.firstName ?? null;

  return {
    ...state,
    organisationId: membership?.organisation.id ?? '',
    organisation: membership?.organisation,
    isOperator: account.data?.operator === true,
    // Addresses the admin by first name, as Czech does, once they gave one.
    greetingName: firstName === null ? null : vocativeOf(firstName),
    canWrite: membershipAllows(membership, 'registrations', 'write'),
    // The Selected Turnus's panels need Registrations read and a Turnus.
    turnus: canReadRegistrations ? turnusy.find(({ id }) => id === turnusId) : undefined,
    canReadCamps,
    hasNothingToShow: !canReadRegistrations && !canReadCamps,
  };
}
