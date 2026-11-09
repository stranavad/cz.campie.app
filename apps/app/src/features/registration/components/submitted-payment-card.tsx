import { useTranslation } from 'react-i18next';

import type { SubmittedRegistration } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Card, CardTitle } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';

interface SubmittedPaymentCardProps {
  submitted: SubmittedRegistration;
  cardStatus: 'redirecting' | 'failed' | null;
}

// What to pay now and with which Variable symbol: the Deposit when it was chosen, else the whole price. A
// card payment is on its way to the gateway, or failed and leaves the transfer.
export function SubmittedPaymentCard({ submitted, cardStatus }: SubmittedPaymentCardProps) {
  const { t } = useTranslation('registration');
  const hasDeposit = submitted.depositTotal !== null;

  return (
    <Card>
      <CardTitle>{hasDeposit ? t('submitted.payDeposit') : t('submitted.payTotal')}</CardTitle>
      <DescriptionList>
        <DescriptionItem label={t('submitted.amount')}>
          <span className="font-display text-xl font-extrabold tabular-nums">
            {czk(submitted.depositTotal ?? submitted.total)}
          </span>
        </DescriptionItem>
        <DescriptionItem label={t('submitted.variableSymbol')}>
          <span className="font-display text-xl font-extrabold tabular-nums">{submitted.variableSymbol}</span>
        </DescriptionItem>
        {hasDeposit ? (
          <DescriptionItem label={t('price.total')}>
            <span className="tabular-nums">{czk(submitted.total)}</span>
          </DescriptionItem>
        ) : null}
      </DescriptionList>
      {cardStatus === 'redirecting' ? <Alert variant="brand">{t('submitted.cardRedirecting')}</Alert> : null}
      {cardStatus === 'failed' ? <Alert variant="danger">{t('submitted.cardFailed')}</Alert> : null}
      {cardStatus === 'redirecting' ? null : <p className="text-sm text-muted-foreground">{t('submitted.email')}</p>}
    </Card>
  );
}
