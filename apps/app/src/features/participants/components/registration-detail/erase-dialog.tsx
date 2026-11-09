import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEraseDialog } from '@/features/participants/components/registration-detail/use-erase-dialog.hook';

interface EraseDialogProps {
  organisationId: string;
  registrationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The Owner's erasure of a Registration to an accounting tombstone: typed confirmation, then gone for good.
export function EraseDialog({ organisationId, registrationId, open, onOpenChange }: EraseDialogProps) {
  const { t } = useTranslation('participants');
  const dialog = useEraseDialog(organisationId, registrationId);
  const inputId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('erase.title')}</DialogTitle>
        <DialogDescription>{t('erase.intro')}</DialogDescription>
        {dialog.isDone ? (
          <Alert variant="success">
            <CircleCheckIcon aria-hidden="true" />
            <output>{t('erase.done')}</output>
          </Alert>
        ) : (
          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor={inputId} className="font-semibold">
              {t('erase.confirm', { word: dialog.word })}
            </label>
            <Input
              id={inputId}
              value={dialog.confirmation}
              onChange={(event) => dialog.setConfirmation(event.target.value)}
            />
          </div>
        )}
        {dialog.isError ? (
          <Alert variant="danger" role="alert">
            <CircleAlertIcon aria-hidden="true" />
            {t('erase.failed')}
          </Alert>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t(dialog.isDone ? 'controls.close' : 'erase.cancel')}
          </DialogClose>
          {dialog.isDone ? null : (
            <Button type="button" variant="destructive" disabled={!dialog.canErase} onClick={dialog.erase}>
              {t('erase.do')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
