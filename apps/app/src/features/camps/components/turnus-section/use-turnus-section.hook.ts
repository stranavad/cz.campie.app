import { useState } from 'react';

import { useRemoveTurnusMutation, useTurnusyQuery } from '@/features/camps/api/camps.queries';

// Which Turnus the form edits, a null id for a new one; null when the form is closed.
type Editing = { readonly turnusId: string | null } | null;

export function useTurnusSection(organisationId: string, campId: string) {
  const turnusy = useTurnusyQuery(organisationId, campId);
  const remove = useRemoveTurnusMutation(organisationId, campId);
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState<string | null>(null);
  const list = turnusy.data ?? [];
  const open = (turnusId: string | null) => {
    setConfirmingRemoval(null);
    setEditing({ turnusId });
  };

  return {
    turnusy,
    list,
    editing,
    edited: list.find((turnus) => turnus.id === editing?.turnusId) ?? null,
    edit: (turnusId: string) => open(turnusId),
    add: () => open(null),
    close: () => setEditing(null),
    // The removal of the Turnus being edited; a new one has none.
    removalOf: (turnusId: string | null) =>
      turnusId === null
        ? null
        : {
            isConfirming: confirmingRemoval === turnusId,
            isRemoving: remove.isPending,
            onAsk: () => setConfirmingRemoval(turnusId),
            onCancel: () => setConfirmingRemoval(null),
            onConfirm: () =>
              remove.mutate(turnusId, {
                onSuccess: () => {
                  setConfirmingRemoval(null);
                  setEditing(null);
                },
              }),
          },
    removalFailed: remove.isError,
  };
}
