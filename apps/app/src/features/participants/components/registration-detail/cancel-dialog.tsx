import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useCancelAllMutation, useCancelParticipantMutation } from '@/features/participants/api/participants.queries';

interface CancelDialogProps {
  organisationId: string;
  detail: RegistrationDetail;
  open: boolean;
  onClose: () => void;
}

// Cancelling one child or all of them; each cancellation waits for a second click on its confirmation.
export function CancelDialog({ organisationId, detail, open, onClose }: CancelDialogProps) {
  const { t } = useTranslation('participants');
  const [confirming, setConfirming] = useState<string | null>(null);
  const confirmed = (key: string, act: () => void) => () => {
    if (confirming === key) {
      setConfirming(null);
      act();
    } else {
      setConfirming(key);
    }
  };
  const cancel = useCancelParticipantMutation(organisationId, detail.id);
  const cancelAll = useCancelAllMutation(organisationId, detail.id);
  const registered = detail.participants.filter(({ status }) => status === 'registered');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
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
                  disabled={cancel.isPending}
                  onClick={confirmed(`cancel-${participant.id}`, () => cancel.mutate(participant.id))}
                >
                  {confirming === `cancel-${participant.id}` ? t('controls.confirm') : t('controls.cancel')}
                </Button>
              ) : (
                <Badge>{t('cancelled')}</Badge>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-end gap-2">
          {registered.length > 1 ? (
            <Button
              type="button"
              variant="destructive"
              disabled={cancelAll.isPending}
              onClick={confirmed('cancel-all', () => cancelAll.mutate())}
            >
              {confirming === 'cancel-all' ? t('controls.confirm') : t('controls.cancelAll')}
            </Button>
          ) : null}
          <DialogClose render={<Button type="button" variant="outline" />}>{t('controls.close')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
