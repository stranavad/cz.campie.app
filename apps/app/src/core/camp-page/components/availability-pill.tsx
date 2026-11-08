import { useTranslation } from 'react-i18next';

import type { PublicTurnus } from '@repo/schema/camps';

import { cn } from '@/lib/utils';

interface AvailabilityPillProps {
  turnus: PublicTurnus;
}

// Whether guardians can register for a Turnus and how many places are left: green while it is open.
export function AvailabilityPill({ turnus }: AvailabilityPillProps) {
  const { t } = useTranslation();
  const isOpen = turnus.availability === 'open';

  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-[13px] leading-snug font-semibold',
        isOpen ? 'bg-success text-success-foreground' : 'bg-muted text-nav-foreground',
      )}
    >
      <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-current" />
      {t(`campPage.availability.${turnus.availability}`, { count: turnus.remainingPlaces })}
    </p>
  );
}
