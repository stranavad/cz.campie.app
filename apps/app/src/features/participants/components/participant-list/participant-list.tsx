import { CircleAlertIcon, SearchXIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ParticipantRow } from '@repo/schema/registrations';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ParticipantCards } from '@/features/participants/components/participant-list/participant-cards';
import { ParticipantTable } from '@/features/participants/components/participant-list/participant-table';
import { cn } from '@/lib/utils';

interface ParticipantListProps {
  rows: ParticipantRow[];
  isLoading: boolean;
  isEmpty: boolean;
  isStale: boolean;
  isError: boolean;
}

// The rows as a table from a tablet up and as a compact list on a phone, both from the same data.
export function ParticipantList({ rows, isLoading, isEmpty, isStale, isError }: ParticipantListProps) {
  const { t } = useTranslation('participants');

  if (isError) {
    return (
      <Alert variant="danger" role="alert">
        <CircleAlertIcon aria-hidden="true" />
        {t('error')}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <output className="block">
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-96 rounded-3xl" />
      </output>
    );
  }

  if (isEmpty) {
    return <EmptyState icon={<SearchXIcon />} title={t('empty')} />;
  }

  return (
    <div aria-busy={isStale} className={cn('transition-opacity duration-150', isStale && 'opacity-60')}>
      <ParticipantTable rows={rows} />
      <ParticipantCards rows={rows} />
    </div>
  );
}
