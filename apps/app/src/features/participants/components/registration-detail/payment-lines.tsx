import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czechDate, czk } from '@repo/schema/shared';

import { LedgerRow } from '@/features/participants/components/registration-detail/ledger-row';

// The payments received, what they add up to, what is left and what is due now.
export function PaymentLines({ ledger }: { ledger: RegistrationDetail['ledger'] }) {
  const { t } = useTranslation('participants');
  const due = ledger.amountDue;

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[13px] font-medium text-muted-foreground">{t('detail.paymentsReceived')}</h3>
      <dl className="flex flex-col text-sm">
        {ledger.payments.map((payment) => (
          <LedgerRow
            key={payment.id}
            label={t(`detail.source.${payment.source}`, { date: czechDate(payment.paidOn), note: payment.note })}
            value={czk(payment.amount)}
          />
        ))}
        <LedgerRow label={t('detail.paid')} value={czk(ledger.paid)} isTotal />
        <LedgerRow label={t('detail.balance')} value={czk(ledger.balance)} />
        <LedgerRow
          label={t(`status.${ledger.status}`)}
          value={
            due.amount === 0
              ? ''
              : due.dueDate === null
                ? t('detail.dueNowUndated', { amount: czk(due.amount) })
                : t('detail.dueNow', { amount: czk(due.amount), date: czechDate(due.dueDate) })
          }
          className="text-muted-foreground"
        />
      </dl>
    </div>
  );
}
