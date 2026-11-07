import { useTranslation } from 'react-i18next';

import { czk } from '@repo/schema/shared';

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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={isBusy} onClick={() => start.mutate('due_now')}>
          {t('card.payNow', { amount: czk(dueNow) })}
        </Button>
        {outstanding === null ? null : (
          <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => start.mutate('balance')}>
            {t('card.payAll', { amount: czk(outstanding) })}
          </Button>
        )}
      </div>
      {start.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('card.failed')}
        </p>
      ) : null}
    </div>
  );
}
