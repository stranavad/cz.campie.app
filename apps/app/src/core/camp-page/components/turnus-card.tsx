import { ExternalLinkIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicTurnus } from '@repo/schema/camps';
import { czechDate, czk } from '@repo/schema/shared';

import { AvailabilityPill } from '@/core/camp-page/components/availability-pill';
import { OpeningCountdown } from '@/core/camp-page/components/opening-countdown';
import { ageLimits } from '@/core/camp-page/helpers/camp-page.helper';

interface TurnusCardProps {
  turnus: PublicTurnus;
  action?: ReactNode;
}

// One Turnus as guardians see it: when, where, for whom, for how much, and whether they can register.
export function TurnusCard({ turnus, action }: TurnusCardProps) {
  const { t } = useTranslation();
  const earlyBird = turnus.earlyBirdPrice !== null && turnus.priceNow === turnus.earlyBirdPrice;
  const ages = turnus.minAge === null && turnus.maxAge === null ? null : ageLimits(t, turnus.minAge, turnus.maxAge);
  const details = [turnus.name, turnus.place, ages].filter((detail) => detail !== null && detail !== '').join(' · ');
  const opensAt = turnus.availability === 'not_yet_open' ? turnus.opensAt : null;

  return (
    <li className="flex flex-col gap-2.5 rounded-3xl border border-border bg-card px-4.5 py-4 sm:p-5">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-heading pt-0.5">
            {t('campPage.dates', { start: czechDate(turnus.startDate), end: czechDate(turnus.endDate) })}
          </h3>
          {opensAt === null ? <AvailabilityPill turnus={turnus} /> : null}
        </div>
        <p className="text-sm text-muted-foreground">{details}</p>
      </div>
      {opensAt === null ? null : <OpeningCountdown opensAt={opensAt} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex flex-col leading-tight">
          <span className="text-lg font-bold tabular-nums">{czk(turnus.priceNow)}</span>
          {earlyBird && turnus.earlyBirdLastDay !== null ? (
            <span className="text-[13px] text-muted-foreground">
              {t('campPage.earlyBird', { date: czechDate(turnus.earlyBirdLastDay), base: czk(turnus.basePrice) })}
            </span>
          ) : null}
          {turnus.deposit === null ? null : (
            <span className="text-[13px] text-muted-foreground">
              {t('campPage.deposit', { amount: czk(turnus.deposit) })}
            </span>
          )}
        </p>
        {action}
      </div>
      {turnus.websiteUrl === null ? null : (
        <a
          href={turnus.websiteUrl}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold underline underline-offset-4 transition-colors hover:text-brand-text"
          target="_blank"
          rel="noreferrer"
        >
          {t('campPage.turnusWebsite')}
          <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
        </a>
      )}
    </li>
  );
}
