import { CreditCardIcon, QrCodeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czk } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TransferDetails } from '@/features/portal/components/home/transfer-details';
import { usePaymentActions } from '@/features/portal/components/home/use-payment-actions.hook';
import { cn } from '@/lib/utils';

interface PaymentActionsProps {
  registration: GuardianRegistration;
}

// Paying what is due: by card through the Organisation's Comgate, or by transfer with a QR platba, side by
// side. Without card payments the transfer details show at once.
export function PaymentActions({ registration }: PaymentActionsProps) {
  const { t } = useTranslation('portal');
  const { payment } = registration;
  const { transferId, isTransferOpen, toggleTransfer, isStarting, hasFailed, canTransfer, payDue, payAll } =
    usePaymentActions(registration);

  if (!payment.card) {
    return <TransferDetails registration={registration} />;
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className={cn('grid gap-2', canTransfer && 'grid-cols-2')}>
        <Button type="button" variant="brand" size="lg" disabled={isStarting} onClick={payDue}>
          <CreditCardIcon aria-hidden="true" />
          {t('card.pay')}
        </Button>
        {canTransfer ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-expanded={isTransferOpen}
            aria-controls={transferId}
            onClick={toggleTransfer}
          >
            <QrCodeIcon aria-hidden="true" />
            {t('qr')}
          </Button>
        ) : null}
      </div>
      {payment.balance === null ? null : (
        <Button
          type="button"
          variant="link"
          className="min-h-11 self-center text-sm"
          disabled={isStarting}
          onClick={payAll}
        >
          {t('card.payAll', { amount: czk(payment.balance.outstanding) })}
        </Button>
      )}
      {hasFailed ? (
        <Alert variant="danger" role="alert">
          {t('card.failed')}
        </Alert>
      ) : null}
      {canTransfer ? (
        <div id={transferId} hidden={!isTransferOpen}>
          <TransferDetails registration={registration} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('noAccount')}</p>
      )}
    </div>
  );
}
