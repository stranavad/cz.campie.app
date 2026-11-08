import { useTranslation } from 'react-i18next';

import type { DiscountCodeResource } from '@repo/schema/camps';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DiscountCodeRow } from '@/features/camps/components/discount-code-section/discount-code-row';

interface DiscountCodeTableProps {
  codes: readonly DiscountCodeResource[];
  canWrite: boolean;
  isUpdating: boolean;
  onToggle: (discountCodeId: string, active: boolean) => void;
  onRemove: (discountCodeId: string) => void;
}

export function DiscountCodeTable({ codes, canWrite, isUpdating, onToggle, onRemove }: DiscountCodeTableProps) {
  const { t } = useTranslation('camps');

  return (
    <Table containerClassName="rounded-none border-0 border-t border-border-subtle bg-transparent">
      <TableHeader>
        <TableRow>
          <TableHead className="sm:pl-6">{t('discountCodes.code')}</TableHead>
          <TableHead>{t('discountCodes.discount')}</TableHead>
          <TableHead>{t('discountCodes.used')}</TableHead>
          <TableHead>{t('discountCodes.validUntil')}</TableHead>
          <TableHead>{t('discountCodes.status')}</TableHead>
          {canWrite ? (
            <TableHead className="sm:pr-6">
              <span className="sr-only">{t('discountCodes.actions')}</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <DiscountCodeRow
            key={code.id}
            code={code}
            canWrite={canWrite}
            isUpdating={isUpdating}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
      </TableBody>
    </Table>
  );
}
