import { CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCampCard } from '@repo/schema/camps';
import { czechDate, czk } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';

interface CampCardSummaryProps {
  camp: PublicCampCard;
}

// When a Camp's Turnusy not yet over run and from what price, as chips on its card.
export function CampCardSummary({ camp: { dates, lowestPrice } }: CampCardSummaryProps) {
  const { t } = useTranslation('campPages');

  if (dates === null && lowestPrice === null) {
    return null;
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {dates === null ? null : (
        <Badge variant="brand" className="h-7 text-[13px] font-semibold">
          <CalendarIcon aria-hidden="true" className="size-3.5" />
          {t('dates', { start: czechDate(dates.startDate), end: czechDate(dates.endDate) })}
        </Badge>
      )}
      {lowestPrice === null ? null : (
        <Badge variant="brand" className="h-7 text-[13px] font-semibold tabular-nums">
          {t('lowestPrice', { price: czk(lowestPrice) })}
        </Badge>
      )}
    </span>
  );
}
