import { useTranslation } from 'react-i18next';

import type { PreviewPriceResponse } from '@repo/schema/camps';
import { czk } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PriceCardProps {
  price: PreviewPriceResponse | undefined;
  // The price shown is of the answers before the last change, while the new one loads.
  isStale: boolean;
  isFailing: boolean;
}

// The price as the camp will store it: every line, the total and what is owed first.
export function PriceCard({ price, isStale, isFailing }: PriceCardProps) {
  const { t } = useTranslation('registration');

  if (price === undefined) {
    return (
      <Alert variant={isFailing ? 'warning' : 'info'}>{isFailing ? t('price.failing') : t('price.pickTurnus')}</Alert>
    );
  }

  return (
    <Card aria-busy={isStale} className={cn('transition-opacity', isStale && 'opacity-60')}>
      <CardTitle>{t('price.title')}</CardTitle>
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
    </Card>
  );
}
