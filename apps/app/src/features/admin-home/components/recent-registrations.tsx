import { Link } from '@tanstack/react-router';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentStatusBadge } from '@/core/participant-list';
import { useRecentRegistrations } from '@/features/admin-home/components/use-recent-registrations.hook';

interface RecentRegistrationsProps {
  organisationId: string;
}

const FRAME = 'gap-0 p-2 sm:p-2';

// "Nové přihlášky": the Organisation's newest Registrations across its Turnusy, each opening its detail.
export function RecentRegistrations({ organisationId }: RecentRegistrationsProps) {
  const { t } = useTranslation('adminHome');
  const recent = useRecentRegistrations(organisationId);
  const title = <CardTitle className="px-4 pt-4 pb-2">{t('recent.title')}</CardTitle>;

  if (recent.isPending) {
    return (
      <Card className={FRAME}>
        {title}
        <output className="flex flex-col gap-2 p-4">
          <span className="sr-only">{t('loading')}</span>
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </output>
      </Card>
    );
  }

  if (recent.isError) {
    return (
      <Card className={FRAME}>
        {title}
        <Alert variant="danger" role="alert" className="m-2">
          <CircleAlertIcon aria-hidden="true" />
          {t('recent.error')}
        </Alert>
      </Card>
    );
  }

  if (recent.rows.length === 0) {
    return (
      <Card className={FRAME}>
        {title}
        <p className="px-4 pt-1 pb-4 text-muted-foreground">{t('recent.nothing')}</p>
      </Card>
    );
  }

  return (
    <Card className={FRAME}>
      {title}
      <ul className="divide-y divide-border-subtle">
        {recent.rows.map((row) => (
          <li key={row.id}>
            <Link
              to="/platform/prihlasky/$registrationId"
              params={{ registrationId: row.id }}
              className="flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-xl px-4 py-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted"
            >
              <span className="flex min-w-0 flex-[1_1_12rem] flex-col leading-snug">
                <span className="font-semibold">{row.names}</span>
                <span className="text-[13px] text-muted-foreground">{row.detail}</span>
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{row.source}</Badge>
                <PaymentStatusBadge status={row.paymentStatus} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
