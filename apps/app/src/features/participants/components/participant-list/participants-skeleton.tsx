import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

// The list page's shape while the membership and the Selected Turnus load.
export function ParticipantsSkeleton() {
  const { t } = useTranslation('participants');

  return (
    <output className="flex flex-col gap-5">
      <span className="sr-only">{t('loading')}</span>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-11 w-full max-w-xl rounded-full" />
      <Skeleton className="h-96 rounded-3xl" />
    </output>
  );
}
