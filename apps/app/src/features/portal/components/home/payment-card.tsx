import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PaymentActions } from '@/features/portal/components/home/payment-actions';
import { PAYMENT_STATUS_BADGES } from '@/features/portal/components/home/payment-status.constant';
import { PriceBreakdown } from '@/features/portal/components/home/price-breakdown';
import { usePaymentCard } from '@/features/portal/components/home/use-payment-card.hook';

interface PaymentCardProps {
  registration: GuardianRegistration;
}

// How a Registration's payment stands: what is left and by when, how much is paid, and how to pay the rest.
export function PaymentCard({ registration }: PaymentCardProps) {
  const { t } = useTranslation('portal');
  const card = usePaymentCard(registration);

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-sans text-sm font-semibold tracking-normal text-muted-foreground">{t('payment')}</h3>
        <Badge variant={PAYMENT_STATUS_BADGES[registration.status]} dot>
          {t(`status.${registration.status}`)}
        </Badge>
      </div>
      <p className="flex flex-col leading-tight">
        <span className="font-display text-[38px] leading-none font-extrabold tracking-tight tabular-nums">
          {card.amount}
        </span>
        <span className="pt-1.5 text-[15px] text-muted-foreground">{card.meaning}</span>
      </p>
      {card.hasTotal ? (
        <div className="flex flex-col gap-2">
          <Progress value={registration.paid / registration.total} label={t('payments')} className="h-2" />
          <span className="text-[13px] text-muted-foreground">{card.paidLine}</span>
        </div>
      ) : null}
      {card.isOverdue ? (
        <Alert variant="danger" role="alert">
          {t('overdue')}
        </Alert>
      ) : null}
      {card.hasSomethingToPay ? <PaymentActions registration={registration} /> : null}
      <PriceBreakdown registration={registration} />
    </Card>
  );
}
