import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ClaimedDiscountsProps {
  discounts: RegistrationDetail['claimedDiscounts'];
  canWrite: boolean;
  onVerify: (fieldId: string, optionId: string | null) => void;
  isVerifying: boolean;
}

// The discounts claimed for a child that the camp verifies, with the verification for Registrations write.
export function ClaimedDiscounts({ discounts, canWrite, onVerify, isVerifying }: ClaimedDiscountsProps) {
  const { t } = useTranslation('participants');

  return (
    <ul className="flex flex-col gap-2 rounded-[20px] bg-muted p-4 text-sm">
      {discounts.map((discount) => (
        <li key={`${discount.fieldId}-${discount.optionId ?? ''}`} className="flex flex-wrap items-center gap-3">
          <span className="min-w-0 flex-1">
            {t('detail.claimed', { label: discount.label, amount: czk(discount.amount) })}
          </span>
          {discount.verifiedAt !== null ? (
            <Badge variant="success">{t('detail.verified')}</Badge>
          ) : canWrite ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isVerifying}
              onClick={() => onVerify(discount.fieldId, discount.optionId)}
            >
              {t('detail.verify')}
            </Button>
          ) : (
            <Badge variant="warning">{t('detail.unverified')}</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
