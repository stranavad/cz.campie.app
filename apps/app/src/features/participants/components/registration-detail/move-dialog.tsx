import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useMoveRegistrationMutation } from '@/features/participants/api/participants.queries';

interface MoveDialogProps {
  organisationId: string;
  registrationId: string;
  // The Camp's other Turnusy.
  others: { id: string; name: string; startDate: string }[];
  open: boolean;
  onClose: () => void;
}

// Moving the whole Registration to another Turnus of the same Camp.
export function MoveDialog({ organisationId, registrationId, others, open, onClose }: MoveDialogProps) {
  const { t } = useTranslation('participants');
  const move = useMoveRegistrationMutation(organisationId, registrationId);
  const [target, setTarget] = useState('');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <DialogContent>
        <DialogTitle>{t('edit.move')}</DialogTitle>
        <DialogDescription>{t('edit.moveNote')}</DialogDescription>
        <Select
          aria-label={t('edit.pickTurnus')}
          placeholder={t('edit.pickTurnus')}
          value={target === '' ? null : target}
          onValueChange={setTarget}
          options={others.map((turnus) => ({
            value: turnus.id,
            label: t('edit.turnusOption', { name: turnus.name, date: czechDate(turnus.startDate) }),
          }))}
        />
        {move.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {t('edit.failed')}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>{t('erase.cancel')}</DialogClose>
          <Button
            type="button"
            disabled={target === '' || move.isPending}
            onClick={() => move.mutate(target, { onSuccess: onClose })}
          >
            {t('edit.moveButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
