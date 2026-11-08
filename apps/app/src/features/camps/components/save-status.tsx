import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SaveStatusProps {
  status: 'saved' | 'failed' | null;
}

// What became of the last save, beside the save button.
export function SaveStatus({ status }: SaveStatusProps) {
  const { t } = useTranslation('camps');

  if (status === 'saved') {
    return (
      <output className="flex items-center gap-1.5 text-sm font-semibold text-success-foreground">
        <CheckIcon aria-hidden="true" className="size-4" />
        {t('saved')}
      </output>
    );
  }

  if (status === 'failed') {
    return (
      <p role="alert" className="rounded-xl bg-danger px-3 py-2 text-sm text-danger-foreground">
        {t('failure')}
      </p>
    );
  }

  return null;
}
