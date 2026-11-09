import { useTranslation } from 'react-i18next';

import type { PublicTurnus } from '@repo/schema/camps';

import { Badge } from '@/components/ui/badge';
import { LAST_PLACES } from '@/core/camp-page/helpers/camp-page.constant';

interface AvailabilityPillProps {
  turnus: PublicTurnus;
}

// Whether guardians can register for a Turnus and how many places are left: green while it is open, amber
// for the last few places.
export function AvailabilityPill({ turnus }: AvailabilityPillProps) {
  const { t } = useTranslation();
  const isOpen = turnus.availability === 'open';
  const isLast = isOpen && turnus.remainingPlaces <= LAST_PLACES;

  return (
    <Badge variant={isLast ? 'warning' : isOpen ? 'success' : 'neutral'} className="h-6.5 text-xs font-bold">
      {isLast
        ? t('campPage.lastPlaces', { count: turnus.remainingPlaces })
        : t(`campPage.availability.${turnus.availability}`, { count: turnus.remainingPlaces })}
    </Badge>
  );
}
