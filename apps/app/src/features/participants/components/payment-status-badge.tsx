import { useTranslation } from 'react-i18next';

import type { PaymentStatus } from '@repo/schema/pricing';

import { Badge } from '@/components/ui/badge';
import { PAYMENT_STATUS_VARIANT } from '@/features/participants/components/payment-status.helper';

// A Registration's payment status as a pill.
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation('participants');

  return (
    <Badge variant={PAYMENT_STATUS_VARIANT[status]} dot>
      {t(`status.${status}`)}
    </Badge>
  );
}
