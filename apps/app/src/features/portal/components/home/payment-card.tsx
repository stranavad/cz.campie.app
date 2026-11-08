import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czk } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HowToPay } from '@/features/portal/components/home/how-to-pay';
import { PriceBreakdown } from '@/features/portal/components/home/price-breakdown';

// How a Registration's payment stands: what is left, how much is paid, and how to pay the rest.
export function PaymentCard({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const isOverpaid = registration.balance < 0;

  return (
    <Card className="gap-3">
      <span className="text-sm font-semibold text-muted-foreground">{t(isOverpaid ? 'overpaid' : 'balance')}</span>
      <span className="font-display text-4xl leading-none font-extrabold tracking-tight tabular-nums">
        {czk(Math.abs(registration.balance))}
      </span>
      {registration.total <= 0 ? null : (
        <div className="flex flex-col gap-2 pt-1">
          <Progress value={registration.paid / registration.total} label={t('payments')} className="h-2" />
          <span className="text-[13px] text-muted-foreground">
            {t('paidOf', { paid: czk(registration.paid), total: czk(registration.total) })}
          </span>
        </div>
      )}
      {registration.overdue && registration.payment.amount !== 0 ? (
        <Alert variant="danger" role="alert">
          {t('overdue')}
        </Alert>
      ) : null}
      {registration.payment.amount === 0 ? null : <HowToPay registration={registration} />}
      <PriceBreakdown registration={registration} />
    </Card>
  );
}
