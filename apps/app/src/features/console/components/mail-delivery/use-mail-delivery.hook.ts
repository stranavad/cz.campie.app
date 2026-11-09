import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { bounceRateOf, hasMailWarning } from '@/features/console/components/mail-delivery/mail-health.helper';

export function useMailDelivery(organisations: readonly ConsoleOrganisation[]) {
  const { t } = useTranslation('console');
  // Each Organisation's mail since it started, summed: the API keeps no shorter window.
  const total = organisations.reduce(
    (sum, { mail }) => ({
      sent: sum.sent + mail.sent,
      bounced: sum.bounced + mail.bounced,
      complained: sum.complained + mail.complained,
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
        rate: bounceRateOf(organisation.mail),
      }))
      .sort((a, b) => b.rate - a.rate),
  };
}
