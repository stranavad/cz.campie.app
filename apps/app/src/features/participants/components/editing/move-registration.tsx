import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useMoveRegistrationMutation } from '@/features/participants/api/participants.queries';
import { EditorTile } from '@/features/participants/components/editing/editor-tile';

interface MoveRegistrationProps {
  organisationId: string;
  registrationId: string;
  // The Camp's other Turnusy.
  others: { id: string; name: string; startDate: string }[];
}

// Moving the Registration to another Turnus of the same Camp.
export function MoveRegistration({ organisationId, registrationId, others }: MoveRegistrationProps) {
  const { t } = useTranslation('participants');
  const move = useMoveRegistrationMutation(organisationId, registrationId);
  const [target, setTarget] = useState('');

  return (
    <EditorTile title={t('edit.move')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          aria-label={t('edit.pickTurnus')}
          placeholder={t('edit.pickTurnus')}
          className="sm:flex-1"
          value={target === '' ? null : target}
          onValueChange={setTarget}
          options={others.map((turnus) => ({
            value: turnus.id,
            label: t('edit.turnusOption', { name: turnus.name, date: czechDate(turnus.startDate) }),
          }))}
        />
        <Button type="button" disabled={target === '' || move.isPending} onClick={() => move.mutate(target)}>
          {t('edit.moveButton')}
        </Button>
      </div>
    </EditorTile>
  );
}
