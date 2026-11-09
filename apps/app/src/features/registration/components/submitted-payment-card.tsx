import { useTranslation } from 'react-i18next';

import type { SubmittedRegistration } from '@repo/schema/registrations';

import { Alert } from '@/components/ui/alert';
import { Card, CardTitle } from '@/components/ui/card';
import { TransferDetails } from '@/core/transfer-details';

interface SubmittedPaymentCardProps {
  submitted: SubmittedRegistration;
  cardStatus: 'redirecting' | 'failed' | null;
}

// What to pay now, by when and how: the Deposit when it was chosen, else the whole price, with the account,
// Variable symbol and QR platba, as the portal shows them. A card payment is on its way to the gateway, or
// failed and leaves the transfer.
export function SubmittedPaymentCard({ submitted, cardStatus }: SubmittedPaymentCardProps) {
  const { t } = useTranslation('registration');

  return (
    <Card>
      <CardTitle>
        {submitted.payment.phase === 'deposit' ? t('submitted.payDeposit') : t('submitted.payTotal')}
      </CardTitle>
      {cardStatus === 'redirecting' ? <Alert variant="brand">{t('submitted.cardRedirecting')}</Alert> : null}
      {cardStatus === 'failed' ? <Alert variant="danger">{t('submitted.cardFailed')}</Alert> : null}
      {cardStatus === 'redirecting' ? null : (
        <TransferDetails payment={submitted.payment} variableSymbol={submitted.variableSymbol} />
      )}
    </Card>
  );
}
