import { CreditCardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { czk } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useStartPortalCardPaymentMutation } from '@/features/portal/api/portal.queries';

interface CardPaymentButtonsProps {
  registrationId: string;
  dueNow: number;
  // Everything outstanding, when it is more than the amount due now.
  outstanding: number | null;
}

// Paying a Registration by card through the Organisation's Comgate: the amount due now, or everything.
export function CardPaymentButtons({ registrationId, dueNow, outstanding }: CardPaymentButtonsProps) {
  const { t } = useTranslation('portal');
  const start = useStartPortalCardPaymentMutation(registrationId);
  const isBusy = start.isPending || start.isSuccess;

  return (
    <>
      <Button type="button" variant="brand" size="lg" disabled={isBusy} onClick={() => start.mutate('due_now')}>
        <CreditCardIcon aria-hidden="true" />
        {t('card.payNow', { amount: czk(dueNow) })}
      </Button>
      {outstanding === null ? null : (
        <Button type="button" variant="outline" size="lg" disabled={isBusy} onClick={() => start.mutate('balance')}>
          {t('card.payAll', { amount: czk(outstanding) })}
        </Button>
      )}
      {start.isError ? (
        <Alert variant="danger" role="alert">
          {t('card.failed')}
        </Alert>
      ) : null}
    </>
  );
}
