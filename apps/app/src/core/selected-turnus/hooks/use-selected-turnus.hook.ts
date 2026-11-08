import { membershipAllows, useCurrentMembership } from '@/core/account';
import { useSelectedTurnusQuery, useSelectTurnusMutation } from '@/core/selected-turnus/api/selected-turnus.queries';

// The Turnus the admin looks at: the remembered one, else the newest. A viewing choice, not a state of the
// camp; it needs Registrations read.
export function useSelectedTurnus() {
  const { membership } = useCurrentMembership();
  const organisationId = membership?.organisation.id ?? '';
  const canRead = membershipAllows(membership, 'registrations', 'read');
  const selected = useSelectedTurnusQuery(organisationId, canRead);
  const select = useSelectTurnusMutation(organisationId);

  return {
    isPending: canRead && selected.isPending,
    turnusy: selected.data?.turnusy ?? [],
    turnusId: selected.data?.turnusId ?? selected.data?.turnusy[0]?.id ?? null,
    selectTurnus: (turnusId: string) => select.mutate(turnusId),
  };
}
