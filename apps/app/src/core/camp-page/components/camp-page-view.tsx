import { CalendarXIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp, PublicTurnus } from '@repo/schema/camps';

import { EmptyState } from '@/components/empty-state';
import { brandAttributes } from '@/core/branding';
import { CampHero } from '@/core/camp-page/components/camp-hero';
import { TurnusCard } from '@/core/camp-page/components/turnus-card';

interface CampPageViewProps {
  camp: PublicCamp;
  turnusy: readonly PublicTurnus[];
  // What a Turnus offers to do, such as a link to its form; the preview offers nothing.
  actionOf?: (turnus: PublicTurnus) => ReactNode;
}

// A Camp's page in its own branding: its Turnusy, and a way back to its website. The public page and the
// admins' preview show the same.
export function CampPageView({ camp, turnusy, actionOf }: CampPageViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 pt-1 pb-8" {...brandAttributes(camp.accentColour)}>
      <CampHero camp={camp} turnusy={turnusy} />
      <section className="flex flex-col gap-3">
        <h2 className="text-heading px-1 text-2xl">{t('campPage.turnusy')}</h2>
        {turnusy.length === 0 ? <EmptyState icon={<CalendarXIcon />} title={t('campPage.noTurnusy')} /> : null}
        <ul className="flex flex-col gap-3">
          {turnusy.map((turnus) => (
            <TurnusCard key={turnus.id} turnus={turnus} action={actionOf?.(turnus)} />
          ))}
        </ul>
      </section>
    </div>
  );
}
