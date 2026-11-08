import { useTranslation } from 'react-i18next';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { czk } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTurnusOverviewQuery } from '@/features/participants/api/participants.queries';
import { OverviewStat } from '@/features/participants/components/overview-stat';
import { PAYMENT_STATUS_VARIANT } from '@/features/participants/components/payment-status.helper';

// The Selected Turnus at a glance: places and money.
export function TurnusOverview({ organisationId, turnusId }: { organisationId: string; turnusId: string }) {
  const { t } = useTranslation('participants');
  const overview = useTurnusOverviewQuery(organisationId, turnusId);

  if (overview.data === undefined) {
    return null;
  }

  const { capacity, registered, expected, received, outstanding, overpaid, overdueRegistrations } = overview.data;
  const byStatus = PAYMENT_STATUSES.filter((status) => overview.data.registrationsByPaymentStatus[status] > 0);

  return (
    <Card className="gap-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <OverviewStat label={t('overview.places')} value={t('overview.placesValue', { registered, capacity })}>
          <Progress value={capacity === 0 ? 0 : registered / capacity} label={t('overview.places')} />
        </OverviewStat>
        <OverviewStat label={t('overview.expected')} value={czk(expected)} />
        <OverviewStat label={t('overview.received')} value={czk(received)} />
        <OverviewStat label={t('overview.outstanding')} value={czk(outstanding)} />
        {overpaid > 0 ? <OverviewStat label={t('overview.overpaid')} value={czk(overpaid)} /> : null}
        <OverviewStat
          label={t('overview.overdue')}
          value={String(overdueRegistrations)}
          className={overdueRegistrations > 0 ? 'text-danger-foreground' : undefined}
        />
      </dl>
      {byStatus.length === 0 ? null : (
        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
          <span className="mr-1 text-[13px] text-muted-foreground">{t('overview.byStatus')}</span>
          {byStatus.map((status) => (
            <Badge key={status} variant={PAYMENT_STATUS_VARIANT[status]} dot>
              {t('overview.statusCount', {
                status: t(`status.${status}`),
                registrations: overview.data.registrationsByPaymentStatus[status],
              })}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
