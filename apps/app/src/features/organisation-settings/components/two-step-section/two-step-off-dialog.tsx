import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface TwoStepOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onConfirm: () => void;
}

// The confirmation before two-step login stops being required of the team.
export function TwoStepOffDialog({ open, onOpenChange, isSaving, onConfirm }: TwoStepOffDialogProps) {
  const { t } = useTranslation('organisationSettings');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('twoStep.offTitle')}</DialogTitle>
        <DialogDescription>{t('twoStep.offDescription')}</DialogDescription>
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>{t('twoStep.offCancel')}</DialogClose>
          <Button type="button" variant="destructive" disabled={isSaving} onClick={onConfirm}>
            {t('twoStep.offConfirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
