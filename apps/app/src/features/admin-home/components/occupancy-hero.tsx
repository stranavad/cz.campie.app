import { useTranslation } from 'react-i18next';

import { czk } from '@repo/schema/shared';

import { StatTile } from '@/components/stat-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { useOccupancyHero } from '@/features/admin-home/components/use-occupancy-hero.hook';

interface OccupancyHeroProps {
  organisationId: string;
  turnus: { id: string; name: string };
}

// The Selected Turnus at a glance: how full it is, its money expected, received and outstanding, and the
// Registrations paid in full and past their due date.
export function OccupancyHero({ organisationId, turnus }: OccupancyHeroProps) {
  const { t } = useTranslation('adminHome');
  const { isPending, figures: hero } = useOccupancyHero(organisationId, turnus.id);

  if (hero === null) {
    return isPending ? <Skeleton className="h-44 rounded-[28px]" /> : null;
  }

  return (
    <section
      aria-label={t('hero.label', { turnus: turnus.name })}
      className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-[28px] bg-brand-soft p-5 sm:p-7"
    >
      <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1.5">
        {hero.percent === null ? null : (
          <>
            <span className="text-sm font-semibold text-nav-foreground">
              {t('hero.filledOf', { turnus: turnus.name })}
            </span>
            <span className="font-display text-6xl leading-[0.95] font-extrabold tracking-[-0.04em] tabular-nums sm:text-[64px]">
              {t('hero.percent', { percent: hero.percent })}
            </span>
          </>
        )}
        <span className="text-[15px] text-nav-foreground">
          {[
            t('hero.places', { registered: hero.registered, count: hero.capacity }),
            hero.left > 0
              ? t('hero.left', { count: hero.left })
              : hero.left === 0
                ? t('hero.full')
                : t('hero.over', { count: -hero.left }),
          ].join(' · ')}
        </span>
      </div>
      <div className="grid min-w-0 flex-[2_1_24rem] grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
        <StatTile label={t('hero.expected')} value={czk(hero.expected)} />
        <StatTile label={t('hero.received')} value={czk(hero.received)} />
        <StatTile label={t('hero.outstanding')} value={czk(hero.outstanding)} />
        {hero.hasOverpaid ? <StatTile label={t('hero.overpaid')} value={czk(hero.overpaid)} /> : null}
        <StatTile label={t('hero.paidInFull')} value={String(hero.paidInFull)} />
        <StatTile
          label={t('hero.overdue')}
          value={String(hero.overdue)}
          className={hero.hasOverdue ? 'text-danger-foreground' : undefined}
        />
      </div>
    </section>
  );
}
