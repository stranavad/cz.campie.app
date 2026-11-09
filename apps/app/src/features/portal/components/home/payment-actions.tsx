import { CreditCardIcon, QrCodeIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';
import { czk } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useStartPortalCardPaymentMutation } from '@/features/portal/api/portal.queries';
import { TransferDetails } from '@/features/portal/components/home/transfer-details';
import { cn } from '@/lib/utils';

// Paying what is due: by card through the Organisation's Comgate, or by transfer with a QR platba, side by
// side. Without card payments the transfer details show at once.
export function PaymentActions({ registration }: { registration: GuardianRegistration }) {
  const { t } = useTranslation('portal');
  const { payment } = registration;
  const start = useStartPortalCardPaymentMutation(registration.id);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const transferId = useId();
  const isStarting = start.isPending || start.isSuccess;
  const canTransfer = payment.account !== null;

  if (!payment.card) {
    return <TransferDetails registration={registration} />;
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className={cn('grid gap-2', canTransfer && 'grid-cols-2')}>
        <Button type="button" variant="brand" size="lg" disabled={isStarting} onClick={() => start.mutate('due_now')}>
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
            onClick={() => setIsTransferOpen(!isTransferOpen)}
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
          onClick={() => start.mutate('balance')}
        >
          {t('card.payAll', { amount: czk(payment.balance.outstanding) })}
        </Button>
      )}
      {start.isError ? (
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
