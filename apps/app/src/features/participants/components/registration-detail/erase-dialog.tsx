import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEraseRegistrationMutation } from '@/features/participants/api/participants.queries';

interface EraseDialogProps {
  organisationId: string;
  registrationId: string;
  open: boolean;
  onClose: () => void;
}

// The Owner's erasure of a Registration to an accounting tombstone: typed confirmation, then gone for good.
export function EraseDialog({ organisationId, registrationId, open, onClose }: EraseDialogProps) {
  const { t } = useTranslation('participants');
  const erase = useEraseRegistrationMutation(organisationId, registrationId);
  const [confirmation, setConfirmation] = useState('');
  const inputId = useId();
  const word = t('erase.word');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <DialogContent>
        <DialogTitle>{t('erase.title')}</DialogTitle>
        <DialogDescription>{t('erase.intro')}</DialogDescription>
        {erase.isSuccess ? (
          <Alert variant="success">
            <CircleCheckIcon aria-hidden="true" />
            <output>{t('erase.done')}</output>
          </Alert>
        ) : (
          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor={inputId} className="font-semibold">
              {t('erase.confirm', { word })}
            </label>
            <Input id={inputId} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </div>
        )}
        {erase.isError ? (
          <Alert variant="danger" role="alert">
            <CircleAlertIcon aria-hidden="true" />
            {t('erase.failed')}
          </Alert>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t(erase.isSuccess ? 'controls.close' : 'erase.cancel')}
          </DialogClose>
          {erase.isSuccess ? null : (
            <Button
              type="button"
              variant="destructive"
              disabled={confirmation.trim().toUpperCase() !== word.toUpperCase() || erase.isPending}
              onClick={() => erase.mutate(undefined)}
            >
              {t('erase.do')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
