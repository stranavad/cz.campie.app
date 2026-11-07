import { useState } from 'react';

import { useRemoveTurnusMutation, useTurnusyQuery } from '@/features/camps/api/camps.queries';

// Which Turnus the form edits, a null id for a new one; null when the form is closed.
type Editing = { readonly turnusId: string | null } | null;

export function useTurnusSection(organisationId: string, campId: string) {
  const turnusy = useTurnusyQuery(organisationId, campId);
  const remove = useRemoveTurnusMutation(organisationId, campId);
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState<string | null>(null);

  return {
    turnusy,
    editing,
    edit: (turnusId: string) => setEditing({ turnusId }),
    add: () => setEditing({ turnusId: null }),
    close: () => setEditing(null),
    confirmingRemoval,
    askToRemove: (turnusId: string) => setConfirmingRemoval(turnusId),
    cancelRemoval: () => setConfirmingRemoval(null),
    remove: (turnusId: string) => remove.mutate(turnusId, { onSuccess: () => setConfirmingRemoval(null) }),
    isRemoving: remove.isPending,
    removalFailed: remove.isError,
  };
}
