import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { CampSummary } from '@repo/schema/camps';

import { cn } from '@/lib/utils';

interface CampSwitcherProps {
  camps: readonly CampSummary[];
  selectedId: string;
}

// Shown only with several Camps; the chosen one is in the address, so a reload keeps it.
export function CampSwitcher({ camps, selectedId }: CampSwitcherProps) {
  const { t } = useTranslation('camps');

  return (
    <nav aria-label={t('switcher')} className="flex flex-wrap gap-2">
      {camps.map((camp) => (
        <Link
          key={camp.id}
          to="/platform/tabory"
          search={{ tabor: camp.id }}
          aria-current={camp.id === selectedId ? 'page' : undefined}
          className={cn(
            'rounded-lg border border-border px-3 py-1.5 text-sm',
            camp.id === selectedId && 'border-primary bg-primary text-primary-foreground',
          )}
        >
          {camp.name}
        </Link>
      ))}
    </nav>
  );
}
