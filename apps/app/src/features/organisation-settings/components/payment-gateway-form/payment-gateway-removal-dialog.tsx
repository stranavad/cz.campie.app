import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface PaymentGatewayRemovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRemoving: boolean;
  onConfirm: () => void;
}

// The confirmation before the Organisation's Comgate keys are deleted and card payment stops.
export function PaymentGatewayRemovalDialog({
  open,
  onOpenChange,
  isRemoving,
  onConfirm,
}: PaymentGatewayRemovalDialogProps) {
  const { t } = useTranslation('organisationSettings');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('paymentGateway.removeTitle')}</DialogTitle>
        <DialogDescription>{t('paymentGateway.removeDescription')}</DialogDescription>
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t('paymentGateway.removeCancel')}
          </DialogClose>
          <Button type="button" variant="destructive" disabled={isRemoving} onClick={onConfirm}>
            {t('paymentGateway.removeConfirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
