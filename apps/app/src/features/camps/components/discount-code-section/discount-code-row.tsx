import { useTranslation } from 'react-i18next';

import type { DiscountCodeResource } from '@repo/schema/camps';
import { czechDate } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { DISCOUNT_CODE_STATUS_BADGES } from '@/features/camps/components/discount-code-section/discount-code-status-badges.constant';

interface DiscountCodeRowProps {
  code: DiscountCodeResource;
  canWrite: boolean;
  isUpdating: boolean;
  onToggle: (discountCodeId: string, active: boolean) => void;
  onRemove: (discountCodeId: string) => void;
}

// One code: its value, uses, expiry and status; switched on or off, removed only while nobody used it.
export function DiscountCodeRow({ code, canWrite, isUpdating, onToggle, onRemove }: DiscountCodeRowProps) {
  const { t } = useTranslation('camps');

  return (
    <TableRow>
      <TableCell className="font-mono text-[15px] font-semibold sm:pl-6">{code.code}</TableCell>
      <TableCell className="whitespace-nowrap">
        {t(`discountCodes.values.${code.kind}`, { value: code.value })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {code.usageLimit === null ? code.uses : t('discountCodes.usesOf', { uses: code.uses, limit: code.usageLimit })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {code.expiresOn === null ? t('discountCodes.noExpiry') : czechDate(code.expiresOn)}
      </TableCell>
      <TableCell>
        <Badge variant={DISCOUNT_CODE_STATUS_BADGES[code.status]}>{t(`discountCodes.statuses.${code.status}`)}</Badge>
      </TableCell>
      {canWrite ? (
        <TableCell className="sm:pr-6">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => onToggle(code.id, !code.active)}>
              {code.active ? t('discountCodes.deactivate') : t('discountCodes.activate')}
            </Button>
            {code.uses === 0 ? (
              <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => onRemove(code.id)}>
                {t('discountCodes.remove')}
              </Button>
            ) : null}
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  );
}
