import { useTranslation } from 'react-i18next';

import type { PreviewPriceResponse } from '@repo/schema/camps';
import { czk } from '@repo/schema/shared';

import { StickyActionBar } from '@/components/sticky-action-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PriceBarProps {
  price: PreviewPriceResponse | undefined;
  isStale: boolean;
  isFailing: boolean;
  hasTurnus: boolean;
  isSending: boolean;
  onSend: () => void;
}

// Pinned to the bottom of the form: the total, what is paid now, and the send button.
export function PriceBar({ price, isStale, isFailing, hasTurnus, isSending, onSend }: PriceBarProps) {
  const { t } = useTranslation('registration');
  const state = isFailing ? t('bar.failing') : hasTurnus ? t('bar.counting') : t('pickTurnus');

  return (
    <StickyActionBar>
      <p aria-live="polite" className={cn('flex min-w-0 flex-1 flex-col leading-tight', isStale && 'opacity-60')}>
        {price === undefined ? (
          <span className="text-sm font-semibold text-muted-foreground">{state}</span>
        ) : (
          <>
            <span className="font-display text-xl font-extrabold tabular-nums">{czk(price.total)}</span>
            <span className="truncate text-[13px] text-muted-foreground">
              {price.depositTotal === null ? t('bar.total') : t('bar.deposit', { amount: czk(price.depositTotal) })}
            </span>
          </>
        )}
      </p>
      <Button type="button" variant="brand" size="lg" onClick={onSend} disabled={isSending}>
        {isSending ? t('sending') : t('send')}
      </Button>
    </StickyActionBar>
  );
}
