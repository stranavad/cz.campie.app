import { useTranslation } from 'react-i18next';

import type { PreviewPriceResponse } from '@repo/schema/camps';

interface PriceCardProps {
  price: PreviewPriceResponse | undefined;
  // The price shown is of the answers before the last change, while the new one loads.
  isStale: boolean;
  isFailing: boolean;
}

const czk = (amount: number) => `${new Intl.NumberFormat('cs-CZ').format(amount)} Kč`;

// The price as the camp will store it: every line, the total and what is owed first.
export function PriceCard({ price, isStale, isFailing }: PriceCardProps) {
  const { t } = useTranslation('registration');

  if (price === undefined) {
    return <p className="text-sm text-muted-foreground">{isFailing ? t('price.failing') : t('price.pickTurnus')}</p>;
  }

  return (
    <section
      aria-busy={isStale}
      className={`flex flex-col gap-2 rounded-lg border-2 border-primary p-4 ${isStale ? 'opacity-60' : ''}`}
    >
      <h2 className="font-semibold">{t('price.title')}</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {price.lines.map((line, index) => (
          <li key={index} className="flex justify-between gap-3">
            <span>
              {line.label ?? t(`price.kinds.${line.kind}`)}
              {line.participant === null ? null : (
                <span className="text-muted-foreground"> {t('price.child', { number: line.participant + 1 })}</span>
              )}
            </span>
            <span className="tabular-nums">{czk(line.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-border pt-2 font-semibold">
        <span>{t('price.total')}</span>
        <span className="tabular-nums">{czk(price.total)}</span>
      </p>
      {price.depositTotal === null ? null : (
        <p className="text-sm">{t('price.deposit', { amount: czk(price.depositTotal) })}</p>
      )}
    </section>
  );
}
