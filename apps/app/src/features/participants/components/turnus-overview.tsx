import { useTranslation } from 'react-i18next';

import { PAYMENT_STATUSES } from '@repo/schema/pricing';
import { czk } from '@repo/schema/shared';

import { useTurnusOverviewQuery } from '@/features/participants/api/participants.queries';

// The Selected Turnus at a glance: places and money.
export function TurnusOverview({ organisationId, turnusId }: { organisationId: string; turnusId: string }) {
  const { t } = useTranslation('participants');
  const overview = useTurnusOverviewQuery(organisationId, turnusId);

  if (overview.data === undefined) {
    return null;
  }

  const {
    capacity,
    registered,
    expected,
    received,
    outstanding,
    overpaid,
    overdueRegistrations,
    registrationsByPaymentStatus,
  } = overview.data;
  const facts = [
    [t('overview.places'), t('overview.placesValue', { registered, capacity })],
    [t('overview.expected'), czk(expected)],
    [t('overview.received'), czk(received)],
    [t('overview.outstanding'), czk(outstanding)],
    ...(overpaid > 0 ? [[t('overview.overpaid'), czk(overpaid)]] : []),
    [t('overview.overdue'), String(overdueRegistrations)],
    [
      t('overview.byStatus'),
      PAYMENT_STATUSES.filter((status) => registrationsByPaymentStatus[status] > 0)
        .map((status) =>
          t('overview.statusCount', {
            status: t(`status.${status}`),
            registrations: registrationsByPaymentStatus[status],
          }),
        )
        .join(', '),
    ],
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border p-3 text-sm sm:grid-cols-3">
      {facts.map(([label, value]) => (
        <div key={label} className="flex flex-col">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
