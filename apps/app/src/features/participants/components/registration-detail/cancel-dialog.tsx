import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useCancelDialog } from '@/features/participants/components/registration-detail/use-cancel-dialog.hook';

interface CancelDialogProps {
  organisationId: string;
  detail: RegistrationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Cancelling one child or all of them; each cancellation waits for a second click on its confirmation.
export function CancelDialog({ organisationId, detail, open, onOpenChange }: CancelDialogProps) {
  const { t } = useTranslation('participants');
  const dialog = useCancelDialog(organisationId, detail);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('controls.title')}</DialogTitle>
        <DialogDescription>{t('controls.cancelNote')}</DialogDescription>
        <ul className="flex flex-col divide-y divide-border-subtle text-sm">
          {detail.participants.map((participant) => (
            <li key={participant.id} className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0 flex-1 font-semibold">
                {t('name', { first: participant.firstName, last: participant.lastName })}
              </span>
              {participant.status === 'registered' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={dialog.isCancelling}
                  onClick={() => dialog.cancelParticipant(participant.id)}
                >
                  {dialog.isConfirming(participant.id) ? t('controls.confirm') : t('controls.cancel')}
                </Button>
              ) : (
                <Badge>{t('cancelled')}</Badge>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-end gap-2">
          {dialog.canCancelAll ? (
            <Button type="button" variant="destructive" disabled={dialog.isCancellingAll} onClick={dialog.cancelAll}>
              {dialog.isConfirming('all') ? t('controls.confirm') : t('controls.cancelAll')}
            </Button>
          ) : null}
          <DialogClose render={<Button type="button" variant="outline" />}>{t('controls.close')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
