import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czechDate, czk } from '@repo/schema/shared';

import { PaymentRow } from '@/features/portal/components/home/payment-row';
import { QrPlatba } from '@/features/portal/components/home/qr-platba';

// Paying by transfer: what to pay now and by when, the account and variable symbol, and the QR platby to
// scan, for the amount due now and, while Deposits are owed, everything at once.
export function TransferDetails({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const { payment } = registration;
  const nowLabel = t(payment.phase === 'deposit' ? 'depositNow' : 'amountNow');

  return (
    <section className="flex flex-col gap-3 border-t border-border-subtle pt-4">
      <h4 className="text-[15px] font-bold">{t('howToPay')}</h4>
      <div className="flex flex-col gap-1.5 text-sm">
        <PaymentRow label={nowLabel} value={czk(payment.amount)} />
        {payment.dueDate === null ? null : <PaymentRow label={t('dueDate')} value={czechDate(payment.dueDate)} />}
        {payment.balance === null ? null : (
          <>
            <PaymentRow
              label={t('rest')}
              value={
                payment.balance.dueDate === null
                  ? czk(payment.balance.amount)
                  : t('restBy', { amount: czk(payment.balance.amount), date: czechDate(payment.balance.dueDate) })
              }
            />
            <PaymentRow label={t('allAtOnce')} value={czk(payment.balance.outstanding)} />
          </>
        )}
        {payment.account === null ? null : <PaymentRow label={t('account')} value={payment.account} />}
        <PaymentRow label={t('variableSymbolLabel')} value={registration.variableSymbol} />
      </div>
      {payment.account === null ? <p className="text-sm text-muted-foreground">{t('noAccount')}</p> : null}
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        {payment.qrPlatba === null ? null : (
          <figure className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-3 text-center">
            <QrPlatba payload={payment.qrPlatba} />
            <figcaption className="text-[13px] font-semibold">
              {t('qrFor', { label: nowLabel, amount: czk(payment.amount) })}
            </figcaption>
          </figure>
        )}
        {payment.balance === null || payment.balance.qrPlatba === null ? null : (
          <figure className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-3 text-center">
            <QrPlatba payload={payment.balance.qrPlatba} />
            <figcaption className="text-[13px] font-semibold">
              {t('qrFor', { label: t('allAtOnce'), amount: czk(payment.balance.outstanding) })}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
