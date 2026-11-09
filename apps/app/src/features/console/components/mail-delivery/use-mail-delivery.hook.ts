import type { ConsoleOrganisation } from '@repo/schema/console';

import {
  bounceRateOf,
  formatRate,
  hasMailWarning,
} from '@/features/console/components/mail-delivery/mail-health.helper';

const numbers = new Intl.NumberFormat('cs-CZ');

export function useMailDelivery(organisations: readonly ConsoleOrganisation[]) {
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
    sent: numbers.format(total.sent),
    bounced: numbers.format(total.bounced),
    complained: numbers.format(total.complained),
    rate: formatRate(bounceRateOf(total)),
    // Those above what mail providers act on, worst first.
    warnings: organisations
      .filter((organisation) => hasMailWarning(organisation.mail))
      .map((organisation) => ({ organisation, rate: bounceRateOf(organisation.mail) }))
      .sort((a, b) => b.rate - a.rate)
      .map(({ organisation, rate }) => ({
        id: organisation.id,
        name: organisation.displayName,
        rate: formatRate(rate),
      })),
  };
}
