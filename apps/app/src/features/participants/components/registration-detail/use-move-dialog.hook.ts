import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SelectedTurnus } from '@repo/schema/registrations';
import { czechDate } from '@repo/schema/shared';

import { useMoveRegistrationMutation } from '@/features/participants/api/participants.queries';

// Moving the whole Registration to one of the Camp's other Turnusy, then closing.
export function useMoveDialog(
  organisationId: string,
  registrationId: string,
  others: SelectedTurnus['turnusy'],
  onMoved: () => void,
) {
  const { t } = useTranslation('participants');
  const move = useMoveRegistrationMutation(organisationId, registrationId);
  const [target, setTarget] = useState<string | null>(null);

  return {
    target,
    setTarget,
    options: others.map((turnus) => ({
      value: turnus.id,
      label: t('edit.turnusOption', { name: turnus.name, date: czechDate(turnus.startDate) }),
    })),
    isError: move.isError,
    canMove: target !== null && !move.isPending,
    move: () => (target === null ? undefined : move.mutate(target, { onSuccess: onMoved })),
  };
}
