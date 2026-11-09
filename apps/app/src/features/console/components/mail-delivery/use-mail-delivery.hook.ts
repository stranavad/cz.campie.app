import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { bounceRateOf, hasMailWarning } from '@/features/console/components/mail-delivery/mail-health.helper';

export function useMailDelivery(organisations: readonly ConsoleOrganisation[]) {
  const { t } = useTranslation('console');
  // Each Organisation's mail over the last 7 days, summed: what mail providers judge a sender by now.
  const total = organisations.reduce(
    (sum, { mail: { lastSevenDays } }) => ({
      sent: sum.sent + lastSevenDays.sent,
      bounced: sum.bounced + lastSevenDays.bounced,
      complained: sum.complained + lastSevenDays.complained,
    }),
    { sent: 0, bounced: 0, complained: 0 },
  );

  return {
    sent: t('mail.count', { value: total.sent }),
    bounced: t('mail.count', { value: total.bounced }),
    complained: t('mail.count', { value: total.complained }),
    rate: bounceRateOf(total),
    // Those above what mail providers act on, worst first.
    warnings: organisations
      .filter((organisation) => hasMailWarning(organisation.mail))
      .map((organisation) => ({
        id: organisation.id,
        name: organisation.displayName,
        rate: bounceRateOf(organisation.mail.lastSevenDays),
      }))
      .sort((a, b) => b.rate - a.rate),
  };
}
