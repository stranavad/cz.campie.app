import { TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertContent, AlertTitle } from '@/components/ui/alert';

// Every legal text is a draft until the lawyer's version replaces it.
export function DraftNotice() {
  const { t } = useTranslation('legal');

  return (
    <Alert variant="warning" role="note">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertContent>
        <AlertTitle>{t('draftNotice.title')}</AlertTitle>
        <p>{t('draftNotice.description')}</p>
      </AlertContent>
    </Alert>
  );
}
