import { useTranslation } from 'react-i18next';

import type { Turnus } from '@repo/schema/camps';
import { czechDate, czk } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';

// From this many free places down, the card warns that the Turnus is filling up.
const LAST_PLACES = 3;

interface PreviewTurnusCardProps {
  turnus: Turnus;
}

// A Turnus as its public page lists it: its free places while open, its dates and price, and the call to
// register, in the accent being chosen.
export function PreviewTurnusCard({ turnus }: PreviewTurnusCardProps) {
  const { t } = useTranslation('camps');
  const free = Math.max(0, turnus.capacity - turnus.registered);
  const isOpen = turnus.availability === 'open';

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-[18px] border border-border bg-card p-3.5">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <strong className="min-w-0 break-words">{turnus.name}</strong>
        <Badge variant={isOpen ? (free <= LAST_PLACES ? 'warning' : 'success') : 'neutral'}>
          {isOpen ? t('branding.previewFree', { count: free }) : t(`turnus.availability.${turnus.availability}`)}
        </Badge>
      </span>
      <span className="text-[13px] text-muted-foreground">
        {[
          t('turnus.dates', { start: czechDate(turnus.startDate), end: czechDate(turnus.endDate) }),
          czk(turnus.basePrice),
        ].join(' · ')}
      </span>
      <span className="flex h-9.5 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
        {t('branding.previewCta')}
      </span>
    </div>
  );
}
