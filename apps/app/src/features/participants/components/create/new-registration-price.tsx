import { useTranslation } from 'react-i18next';

import type { NewRegistrationPrice as Price } from '@repo/schema/registrations';
import { czechDate, czk } from '@repo/schema/shared';

import { cn } from '@/lib/utils';

interface NewRegistrationPriceProps {
  price: Price;
  // The price shown is of the answers before the last change, while the new one loads.
  isStale: boolean;
}

// The price as creating the Registration will store it: every line, the total, the Deposit and the due dates.
export function NewRegistrationPrice({ price, isStale }: NewRegistrationPriceProps) {
  const { t } = useTranslation('participants');

  return (
    <div aria-busy={isStale} className={cn('flex flex-col gap-3 transition-opacity', isStale && 'opacity-60')}>
      <ul className="flex flex-col gap-2 text-sm">
        {price.lines.map((line, index) => (
          <li key={index} className="flex justify-between gap-3">
            <span>
              {line.label ?? t(`edit.kinds.${line.kind}`)}
              {line.participant === null ? null : (
                <span className="text-muted-foreground"> {t('create.child', { number: line.participant + 1 })}</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums">{czk(line.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-baseline justify-between gap-3 border-t border-border-subtle pt-3">
        <span className="font-bold">{t('create.total')}</span>
        <span className="font-display text-xl font-extrabold tabular-nums">{czk(price.total)}</span>
      </p>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {price.depositTotal === null ? (
          <p>{t('create.dueInFull', { date: czechDate(price.depositDueDate) })}</p>
        ) : (
          <>
            <p>{t('create.depositDue', { amount: czk(price.depositTotal), date: czechDate(price.depositDueDate) })}</p>
            {price.balanceDueDate === null ? null : (
              <p>{t('create.balanceDue', { date: czechDate(price.balanceDueDate) })}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
