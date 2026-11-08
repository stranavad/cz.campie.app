import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Card, CardTitle } from '@/components/ui/card';
import { AuditEntryView } from '@/core/audit';
import type { useRegistrationDetailPage } from '@/features/participants/components/use-registration-detail-page.hook';

interface HistoryCardProps {
  history: ReturnType<typeof useRegistrationDetailPage>['history'];
}

// Who changed what on the Registration, newest as the API orders it.
export function HistoryCard({ history }: HistoryCardProps) {
  const { t } = useTranslation('participants');

  return (
    <Card>
      <CardTitle>{t('detail.history')}</CardTitle>
      <ol className="flex flex-col gap-3.5">
        {history.map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-subtle-foreground" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <AuditEntryView entry={entry} />
              <time dateTime={entry.occurredAt} className="text-[13px] text-subtle-foreground">
                {czechDateTime(entry.occurredAt)}
              </time>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
