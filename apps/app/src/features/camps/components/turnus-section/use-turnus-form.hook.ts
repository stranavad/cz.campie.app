import { useState } from 'react';

import type { Turnus } from '@repo/schema/camps';

import { useAppForm } from '@/core/form';
import { useSaveTurnusMutation } from '@/features/camps/api/camps.queries';
import {
  turnusBodyOf,
  turnusFormSchema,
  turnusFormValues,
} from '@/features/camps/components/turnus-section/turnus-form.schema';

/**
 * Bring the editor into view when it opens: on a phone it sits under the list. Left alone when visible.
 * Defined once, so React calls it only when the editor mounts.
 * @param node the editor, or null when it unmounts
 */
function revealOnMount(node: HTMLElement | null) {
  node?.scrollIntoView({ block: 'nearest' });
}

// The id is what the admin opened, not the list's copy: a Turnus removed meanwhile then fails to save
// rather than being created anew.
export function useTurnusForm(
  organisationId: string,
  campId: string,
  { turnusId, turnus }: { turnusId: string | null; turnus: Turnus | null },
  onDone: () => void,
) {
  const save = useSaveTurnusMutation(organisationId, campId);
  const [hasFailed, setFailed] = useState(false);

  const form = useAppForm({
    defaultValues: turnusFormValues(turnus),
    validators: { onChange: turnusFormSchema },
    onSubmit: async ({ value }) => {
      setFailed(false);

      try {
        await save.mutateAsync({ turnusId, body: turnusBodyOf(value) });
        onDone();
      } catch {
        setFailed(true);
      }
    },
  });

  return { form, hasFailed, revealRef: revealOnMount };
}
