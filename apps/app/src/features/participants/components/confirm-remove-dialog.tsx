import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ConfirmRemoveDialogProps {
  // The link that opens it.
  label: string;
  // Names what goes ("Odebrat zástupce Jana Nováka?").
  title: string;
  // What the removal means, such as losing portal access.
  description: string;
  isPending: boolean;
  isError: boolean;
  onConfirm: () => void;
}

// A removal from the Registration behind a confirmation; the removed entry leaves the page, closing it.
export function ConfirmRemoveDialog({
  label,
  title,
  description,
  isPending,
  isError,
  onConfirm,
}: ConfirmRemoveDialogProps) {
  const { t } = useTranslation('participants');

  return (
    <Dialog>
      <DialogTrigger
        render={<Button type="button" variant="link" className="min-h-11 self-start text-sm sm:min-h-8" />}
      >
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {isError ? (
          <Alert variant="danger" role="alert">
            <CircleAlertIcon aria-hidden="true" />
            {t('controls.removeFailed')}
          </Alert>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>{t('erase.cancel')}</DialogClose>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
            {t('controls.remove')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
