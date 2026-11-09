import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Card, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWaitingList } from '@/features/admin-home/components/use-waiting-list.hook';
import { WaitingRow } from '@/features/admin-home/components/waiting-row';

interface WaitingListProps {
  organisationId: string;
  turnusId: string;
  canWrite: boolean;
}

// "Čeká na vás": the Turnus's open items, each with its count and the place to deal with it.
export function WaitingList({ organisationId, turnusId, canWrite }: WaitingListProps) {
  const { t } = useTranslation('adminHome');
  const list = useWaitingList(organisationId, turnusId, canWrite);

  return (
    <Card className="gap-0 p-2 sm:p-2">
      <CardTitle className="px-4 pt-4 pb-2">{t('waiting.title')}</CardTitle>
      {list.isPending ? (
        <output className="flex flex-col gap-2 p-4">
          <span className="sr-only">{t('loading')}</span>
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </output>
      ) : null}
      {list.isError ? (
        <Alert variant="danger" role="alert" className="m-2">
          <CircleAlertIcon aria-hidden="true" />
          {t('waiting.error')}
        </Alert>
      ) : null}
      {!list.isPending && !list.isError && list.items.length === 0 ? (
        <p className="px-4 pt-1 pb-4 text-muted-foreground">{t('waiting.nothing')}</p>
      ) : null}
      {list.items.length === 0 ? null : (
        <ul className="divide-y divide-border-subtle">
          {list.items.map((item) => (
            <WaitingRow key={item.key} item={item} />
          ))}
        </ul>
      )}
    </Card>
  );
}
