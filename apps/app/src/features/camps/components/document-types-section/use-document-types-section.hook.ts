import { useState } from 'react';

import type { DocumentType } from '@repo/schema/documents';

import { useTurnusyQuery } from '@/core/camp-list';
import { useDocumentTypesQuery } from '@/features/camps/api/camps.queries';

// The Camp's Document types, which one is open to edit, and the names of the Turnusy a download is for.
export function useDocumentTypesSection(organisationId: string, campId: string) {
  const types = useDocumentTypesQuery(organisationId, campId);
  const turnusy = useTurnusyQuery(organisationId, campId);
  // null: a new type; undefined: none opened.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);

  return {
    types,
    openId,
    open: setOpenId,
    close: () => setOpenId(undefined),
    hasNone: types.data?.length === 0,
    // Null when the type is for every Turnus.
    turnusNamesOf: ({ turnusIds }: DocumentType) => {
      const names = (turnusy.data ?? []).filter(({ id }) => turnusIds.includes(id)).map(({ name }) => name);

      return names.length === 0 ? null : names.join(', ');
    },
  };
}
