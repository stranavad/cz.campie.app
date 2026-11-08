import { QrCodeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czk } from '@repo/schema/shared';

import { buttonVariants } from '@/components/ui/button';
import { QrPlatba } from '@/features/portal/components/home/qr-platba';

// The QR platby to scan, folded away until asked for: the amount due now and, while Deposits are owed,
// everything at once.
export function QrPaymentDetails({ payment }: { payment: GuardianRegistration['payment'] }) {
  const { t } = useTranslation('portal');
  const balanceQr = payment.balance?.qrPlatba ?? null;

  if (payment.qrPlatba === null && balanceQr === null) {
    return null;
  }

  return (
    <details className="group">
      <summary
        className={buttonVariants({
          variant: 'outline',
          size: 'lg',
          className: 'w-full list-none group-open:bg-muted [&::-webkit-details-marker]:hidden',
        })}
      >
        <QrCodeIcon aria-hidden="true" />
        {t('qr')}
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        {payment.qrPlatba === null ? null : (
          <figure className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-3 text-center">
            <QrPlatba payload={payment.qrPlatba} />
            <figcaption className="text-[13px] font-semibold">
              {t('qrFor', {
                label: t(payment.phase === 'deposit' ? 'depositNow' : 'amountNow'),
                amount: czk(payment.amount),
              })}
            </figcaption>
          </figure>
        )}
        {balanceQr === null || payment.balance === null ? null : (
          <figure className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-3 text-center">
            <QrPlatba payload={balanceQr} />
            <figcaption className="text-[13px] font-semibold">
              {t('qrFor', { label: t('allAtOnce'), amount: czk(payment.balance.outstanding) })}
            </figcaption>
          </figure>
        )}
      </div>
    </details>
  );
}
