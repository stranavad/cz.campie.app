import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

// The detail's shape while the Registration loads.
export function DetailSkeleton() {
  const { t } = useTranslation('participants');

  return (
    <output className="flex flex-col gap-6">
      <span className="sr-only">{t('loading')}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-3xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
      </div>
    </output>
  );
}
