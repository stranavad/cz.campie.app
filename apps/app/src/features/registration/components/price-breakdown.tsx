import { useTranslation } from 'react-i18next';

import type { PreviewPriceResponse } from '@repo/schema/camps';
import { czk } from '@repo/schema/shared';

import { cn } from '@/lib/utils';

interface PriceBreakdownProps {
  price: PreviewPriceResponse;
  // The price shown is of the answers before the last change, while the new one loads.
  isStale: boolean;
}

// The price as the camp will store it: every line, the total and what is owed first.
export function PriceBreakdown({ price, isStale }: PriceBreakdownProps) {
  const { t } = useTranslation('registration');

  return (
    <div aria-busy={isStale} className={cn('flex flex-col gap-3 transition-opacity', isStale && 'opacity-60')}>
      <ul className="flex flex-col gap-2 text-[15px]">
        {price.lines.map((line, index) => (
          <li key={index} className="flex justify-between gap-3">
            <span>
              {line.label ?? t(`price.kinds.${line.kind}`)}
              {line.participant === null ? null : (
                <span className="text-muted-foreground"> {t('price.child', { number: line.participant + 1 })}</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums">{czk(line.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-baseline justify-between gap-3 border-t border-border-subtle pt-3">
        <span className="font-bold">{t('price.total')}</span>
        <span className="font-display text-xl font-extrabold tabular-nums">{czk(price.total)}</span>
      </p>
      {price.depositTotal === null ? null : (
        <p className="text-sm text-muted-foreground">{t('price.deposit', { amount: czk(price.depositTotal) })}</p>
      )}
    </div>
  );
}
