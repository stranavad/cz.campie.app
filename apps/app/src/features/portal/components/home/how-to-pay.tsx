import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate, czk } from '@repo/schema/shared';

import { CardPaymentButtons } from '@/features/portal/components/home/card-payment-buttons';
import { PaymentRow } from '@/features/portal/components/home/payment-row';
import { QrPaymentDetails } from '@/features/portal/components/home/qr-payment-details';

// What to pay now and by when, the account to pay it to, and the card and QR platba ways to pay.
export function HowToPay({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const { payment } = registration;

  return (
    <section className="flex flex-col gap-3 border-t border-border-subtle pt-4">
      <h3 className="text-[15px] font-bold">{t('howToPay')}</h3>
      <div className="flex flex-col gap-1.5 text-sm">
        <PaymentRow
          label={payment.phase === 'deposit' ? t('depositNow') : t('amountNow')}
          value={czk(payment.amount)}
        />
        {payment.dueDate === null ? null : <PaymentRow label={t('dueDate')} value={czechDate(payment.dueDate)} />}
        {payment.balance === null ? null : (
          <PaymentRow
            label={t('rest')}
            value={
              payment.balance.dueDate === null
                ? czk(payment.balance.amount)
                : t('restBy', { amount: czk(payment.balance.amount), date: czechDate(payment.balance.dueDate) })
            }
          />
        )}
        {payment.balance === null ? null : (
          <PaymentRow label={t('allAtOnce')} value={czk(payment.balance.outstanding)} />
        )}
        {payment.account === null ? null : <PaymentRow label={t('account')} value={payment.account} />}
        <PaymentRow label={t('variableSymbolLabel')} value={registration.variableSymbol} />
      </div>
      {payment.account === null ? <p className="text-sm text-muted-foreground">{t('noAccount')}</p> : null}
      <div className="flex flex-col gap-2">
        {payment.card ? (
          <CardPaymentButtons
            registrationId={registration.id}
            dueNow={payment.amount}
            outstanding={payment.balance?.outstanding ?? null}
          />
        ) : null}
        <QrPaymentDetails payment={payment} />
      </div>
    </section>
  );
}
