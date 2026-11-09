import { useTranslation } from 'react-i18next';

import type { SelectedTurnus } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useMoveDialog } from '@/features/participants/components/registration-detail/use-move-dialog.hook';

interface MoveDialogProps {
  organisationId: string;
  registrationId: string;
  // The Camp's other Turnusy.
  others: SelectedTurnus['turnusy'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Moving the whole Registration to another Turnus of the same Camp.
export function MoveDialog({ organisationId, registrationId, others, open, onOpenChange }: MoveDialogProps) {
  const { t } = useTranslation('participants');
  const dialog = useMoveDialog(organisationId, registrationId, others, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('edit.move')}</DialogTitle>
        <DialogDescription>{t('edit.moveNote')}</DialogDescription>
        <Select
          aria-label={t('edit.pickTurnus')}
          placeholder={t('edit.pickTurnus')}
          value={dialog.target}
          onValueChange={dialog.setTarget}
          options={dialog.options}
        />
        {dialog.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {t('edit.failed')}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>{t('erase.cancel')}</DialogClose>
          <Button type="button" disabled={!dialog.canMove} onClick={dialog.move}>
            {t('edit.moveButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
