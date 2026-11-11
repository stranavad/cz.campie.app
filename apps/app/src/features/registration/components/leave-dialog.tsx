import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface LeaveDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

// The question before the guardian leaves the form with answers not yet sent.
export function LeaveDialog({ open, onStay, onLeave }: LeaveDialogProps) {
  const { t } = useTranslation('registration');

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onStay())}>
      <DialogContent>
        <DialogTitle>{t('leave.title')}</DialogTitle>
        <DialogDescription>{t('leave.description')}</DialogDescription>
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>{t('leave.stay')}</DialogClose>
          <Button type="button" variant="destructive" onClick={onLeave}>
            {t('leave.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
