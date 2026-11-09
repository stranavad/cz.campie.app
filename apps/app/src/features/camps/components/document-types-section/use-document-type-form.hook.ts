import { useState } from 'react';

import { documentTypeBodySchema, type DocumentType } from '@repo/schema/documents';

import { useTurnusyQuery } from '@/core/camp-list';
import { useDocumentTypeMutations } from '@/features/camps/api/camps.queries';

// One Document type being written: its fields, the body they make, and the changes that save it.
export function useDocumentTypeForm(organisationId: string, campId: string, type: DocumentType | null) {
  const turnusy = useTurnusyQuery(organisationId, campId);
  const mutations = useDocumentTypeMutations(organisationId, campId);
  const [kind, setKind] = useState(type?.kind ?? 'requirement');
  const [name, setName] = useState(type?.name ?? '');
  const [description, setDescription] = useState(type?.description ?? '');
  const [dueDate, setDueDate] = useState(type?.dueDate ?? '');
  const [turnusIds, setTurnusIds] = useState<readonly string[]>(type?.turnusIds ?? []);
  // A Turnus removed since is dropped, so saving never names one the Camp no longer has.
  const existing = new Set((turnusy.data ?? []).map(({ id }) => id));
  const body = documentTypeBodySchema.safeParse({
    kind,
    name,
    description,
    dueDate: kind === 'requirement' && dueDate !== '' ? dueDate : null,
    turnusIds: kind === 'download' ? turnusIds.filter((id) => existing.has(id)) : [],
  });

  return {
    turnusy: turnusy.data ?? [],
    mutations,
    kind,
    setKind,
    name,
    setName,
    description,
    setDescription,
    dueDate,
    setDueDate,
    turnusIds,
    setTurnusChosen: (turnusId: string, chosen: boolean) =>
      setTurnusIds(chosen ? [...turnusIds, turnusId] : turnusIds.filter((id) => id !== turnusId)),
    canSave: body.success && !mutations.save.isPending,
    save: (onDone: () => void) => {
      if (body.success) {
        mutations.save.mutate({ id: type?.id ?? null, body: body.data }, { onSuccess: onDone });
      }
    },
    remove: (onDone: () => void) => {
      if (type !== null) {
        mutations.remove.mutate(type.id, { onSuccess: onDone });
      }
    },
    saveFailed: mutations.save.isError || mutations.remove.isError,
  };
}
