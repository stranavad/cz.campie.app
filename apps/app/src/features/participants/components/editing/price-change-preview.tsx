import { useTranslation } from 'react-i18next';

import type { PriceChange } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

// The price lines a change of answers would add, shown before it is saved.
export function PriceChangePreview({ change }: { change: PriceChange }) {
  const { t } = useTranslation('participants');

  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-muted p-3 text-sm">
      <p className="font-semibold">{change.lines.length === 0 ? t('edit.noPriceChange') : t('edit.priceChange')}</p>
      {change.lines.map((line, index) => (
        <p key={index} className="tabular-nums">
          {t('edit.line', { label: line.label ?? t(`edit.kinds.${line.kind}`), amount: czk(line.amount) })}
        </p>
      ))}
    </div>
  );
}
