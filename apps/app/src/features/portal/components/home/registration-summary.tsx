import { TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PAYMENT_STATUS_BADGES } from '@/features/portal/components/home/payment-status.constants';

// Whom a Registration places, when, and how its payment stands.
export function RegistrationSummary({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const { turnus } = registration;
  const dates = t('dates', { start: czechDate(turnus.startDate), end: czechDate(turnus.endDate) });

  return (
    <Card className="gap-3">
      <div className="flex items-start justify-between gap-3">
        <ul className="flex min-w-0 flex-col gap-0.5">
          {registration.participants.map((participant) => (
            <li
              key={participant.id}
              className={
                participant.status === 'cancelled'
                  ? 'font-display text-lg font-bold text-muted-foreground line-through'
                  : 'font-display text-xl leading-tight font-bold tracking-tight'
              }
            >
              {t(participant.status === 'cancelled' ? 'participantCancelled' : 'participant', {
                first: participant.firstName,
                last: participant.lastName,
              })}
            </li>
          ))}
        </ul>
        <Badge variant={PAYMENT_STATUS_BADGES[registration.status]} dot>
          {t(`status.${registration.status}`)}
        </Badge>
      </div>
      <p className="flex flex-col text-sm text-muted-foreground">
        <span>{turnus.place === '' ? dates : t('datesAt', { dates, place: turnus.place })}</span>
        <span>{t('variableSymbol', { symbol: registration.variableSymbol })}</span>
      </p>
      {registration.undeliverableEmails.length === 0 ? null : (
        <Alert variant="warning" role="alert" className="wrap-anywhere">
          <TriangleAlertIcon aria-hidden="true" />
          {t('undeliverable', { emails: registration.undeliverableEmails.join(', ') })}
        </Alert>
      )}
    </Card>
  );
}
