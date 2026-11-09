import { TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { StatTile } from '@/components/stat-tile';
import { Alert } from '@/components/ui/alert';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { useMailDelivery } from '@/features/console/components/mail-delivery/use-mail-delivery.hook';

interface MailDeliveryProps {
  organisations: readonly ConsoleOrganisation[];
}

// How the platform's mail fared over the last 7 days, summed over every Organisation, and which
// Organisations bounce or draw complaints above what mail providers act on.
export function MailDelivery({ organisations }: MailDeliveryProps) {
  const { t } = useTranslation('console');
  const mail = useMailDelivery(organisations);

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <CardTitle>{t('mail.title')}</CardTitle>
        <CardDescription>{t('mail.intro', { rate: mail.rate })}</CardDescription>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
        <StatTile label={t('mail.sent')} value={mail.sent} className="bg-muted" />
        <StatTile label={t('mail.bounced')} value={mail.bounced} className="bg-muted" />
        <StatTile label={t('mail.complained')} value={mail.complained} className="bg-muted" />
      </div>
      {mail.warnings.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('mail.healthy')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {mail.warnings.map((warning) => (
            <li key={warning.id}>
              <Alert variant="warning">
                <TriangleAlertIcon aria-hidden="true" />
                <span>{t('mail.warning', { organisation: warning.name, rate: warning.rate })}</span>
              </Alert>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
