import { ChevronUpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PreviewPriceResponse } from '@repo/schema/camps';
import { czk } from '@repo/schema/shared';

import { StickyActionBar } from '@/components/sticky-action-bar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PriceBreakdown } from '@/features/registration/components/price-breakdown';
import { cn } from '@/lib/utils';

interface PriceBarProps {
  price: PreviewPriceResponse | undefined;
  isStale: boolean;
  isFailing: boolean;
  hasTurnus: boolean;
  // The step's action: on to the next step, or sending on the last.
  action: string;
  isBusy: boolean;
  onAction: () => void;
}

// Pinned to the bottom of the form: the total and what is paid now, opening the price's lines, and the
// step's action.
export function PriceBar({ price, isStale, isFailing, hasTurnus, action, isBusy, onAction }: PriceBarProps) {
  const { t } = useTranslation('registration');
  const state = isFailing ? t('bar.failing') : hasTurnus ? t('bar.counting') : t('pickTurnus');

  return (
    <StickyActionBar>
      {price === undefined ? (
        <p aria-live="polite" className="min-w-0 flex-1 text-sm font-semibold text-muted-foreground">
          {state}
        </p>
      ) : (
        <Sheet>
          <SheetTrigger
            className={cn(
              'flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-start rounded-2xl text-left leading-tight transition-opacity outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              isStale && 'opacity-60',
            )}
          >
            <span aria-live="polite" className="font-display text-xl font-extrabold tabular-nums">
              {czk(price.total)}
            </span>
            <span className="flex max-w-full items-center gap-1 text-[13px] text-muted-foreground">
              <span className="truncate">
                {t('bar.breakdown', {
                  summary:
                    price.depositTotal === null
                      ? t('bar.total')
                      : t('bar.deposit', { amount: czk(price.depositTotal) }),
                })}
              </span>
              <ChevronUpIcon aria-hidden="true" className="size-3.5 shrink-0" />
            </span>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('price.title')}</SheetTitle>
            </SheetHeader>
            <PriceBreakdown price={price} isStale={isStale} />
          </SheetContent>
        </Sheet>
      )}
      <Button type="button" variant="brand" size="lg" onClick={onAction} disabled={isBusy}>
        {action}
      </Button>
    </StickyActionBar>
  );
}
