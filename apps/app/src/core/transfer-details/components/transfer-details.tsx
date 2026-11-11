import { useTranslation } from 'react-i18next';

import type { RegistrationPayment } from '@repo/schema/registrations';
import { czechDate, czk } from '@repo/schema/shared';

import { PaymentRow } from '@/components/payment-row';
import { QrCode } from '@/components/qr-code';

interface TransferDetailsProps {
  payment: RegistrationPayment;
  variableSymbol: string;
}

// Paying by transfer: what to pay now and by when, the account and variable symbol, and the QR platby to
// scan, for the amount due now and, while Deposits are owed, everything at once; and what an Invoice request
// leaves to a company. The QR codes sit beside the details, below them in a narrow card.
export function TransferDetails({ payment, variableSymbol }: TransferDetailsProps) {
  const { t } = useTranslation('common', { keyPrefix: 'transfer' });
  const nowLabel = t(payment.phase === 'deposit' ? 'depositNow' : 'amountNow');
  const qrCodes = [
    payment.qrPlatba === null
      ? null
      : { payload: payment.qrPlatba, label: t('qrFor', { label: nowLabel, amount: czk(payment.amount) }) },
    payment.balance === null || payment.balance.qrPlatba === null
      ? null
      : {
          payload: payment.balance.qrPlatba,
          label: t('qrFor', { label: t('allAtOnce'), amount: czk(payment.balance.outstanding) }),
        },
  ].filter((qr) => qr !== null);

  return (
    <section className="@container flex flex-col gap-3 border-t border-border-subtle pt-4">
      <h4 className="text-[15px] font-bold">{t('howToPay')}</h4>
      <div className="flex flex-col gap-4 @lg:flex-row @lg:items-start @lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
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
            <PaymentRow label={t('variableSymbolLabel')} value={variableSymbol} />
            {payment.invoiced === null ? null : (
              <PaymentRow
                label={t('invoiced', { company: payment.invoiced.companyName })}
                value={czk(payment.invoiced.amount)}
              />
            )}
          </div>
          {payment.account === null ? <p className="text-sm text-muted-foreground">{t('noAccount')}</p> : null}
        </div>
        {qrCodes.length === 0 ? null : (
          <div className="flex flex-wrap justify-center gap-4">
            {qrCodes.map((qr) => (
              <QrFigure key={qr.payload} {...qr} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface QrFigureProps {
  payload: string;
  label: string;
}

function QrFigure({ payload, label }: QrFigureProps) {
  const { t } = useTranslation('common', { keyPrefix: 'transfer' });

  return (
    <figure className="flex w-40 flex-col items-center gap-2 text-center">
      <QrCode payload={payload} alt={t('qr')} />
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  );
}
