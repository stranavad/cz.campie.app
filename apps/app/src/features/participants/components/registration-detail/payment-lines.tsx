import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czechDate, czk } from '@repo/schema/shared';

import { LedgerRow } from '@/features/participants/components/registration-detail/ledger-row';

interface PaymentLinesProps {
  ledger: RegistrationDetail['ledger'];
}

// The payments received and what they add up to.
export function PaymentLines({ ledger }: PaymentLinesProps) {
  const { t } = useTranslation('participants');

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[13px] font-medium text-muted-foreground">{t('detail.paymentsReceived')}</h3>
      <dl className="flex flex-col text-sm">
        {ledger.payments.map((payment) => (
          <LedgerRow
            key={payment.id}
            label={t(`detail.source.${payment.source}`, { date: czechDate(payment.paidOn), note: payment.note })}
            value={czk(payment.amount)}
            className={payment.amount > 0 ? 'text-success-foreground' : undefined}
          />
        ))}
        <LedgerRow label={t('detail.paid')} value={czk(ledger.paid)} isTotal />
      </dl>
    </div>
  );
}
