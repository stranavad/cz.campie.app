import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicTurnus } from '@repo/schema/camps';

import { OpeningCountdown } from '@/core/camp-page/components/opening-countdown';
import { ageLimits, czechDate, czk } from '@/core/camp-page/helpers/camp-page.helper';

interface TurnusCardProps {
  turnus: PublicTurnus;
  action?: ReactNode;
}

// One Turnus as guardians see it: when, where, for whom, for how much, and whether they can register.
export function TurnusCard({ turnus, action }: TurnusCardProps) {
  const { t } = useTranslation();
  const earlyBird = turnus.earlyBirdPrice !== null && turnus.priceNow === turnus.earlyBirdPrice;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold">{turnus.name}</h3>
      <p className="flex flex-wrap gap-x-3 text-sm">
        <span>{t('campPage.dates', { start: czechDate(turnus.startDate), end: czechDate(turnus.endDate) })}</span>
        <span>{turnus.place}</span>
      </p>
      {turnus.minAge === null && turnus.maxAge === null ? null : (
        <p className="text-sm text-muted-foreground">{ageLimits(t, turnus.minAge, turnus.maxAge)}</p>
      )}
      <p className="font-medium">
        {czk(turnus.priceNow)}
        {earlyBird && turnus.earlyBirdLastDay !== null ? (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {t('campPage.earlyBird', { date: czechDate(turnus.earlyBirdLastDay), base: czk(turnus.basePrice) })}
          </span>
        ) : null}
      </p>
      {turnus.availability === 'not_yet_open' && turnus.opensAt !== null ? (
        <OpeningCountdown opensAt={turnus.opensAt} />
      ) : (
        <p className="text-sm font-medium text-ring">
          {t(`campPage.availability.${turnus.availability}`, { count: turnus.remainingPlaces })}
        </p>
      )}
      {action}
      {turnus.websiteUrl === null ? null : (
        <a href={turnus.websiteUrl} className="text-sm underline" target="_blank" rel="noreferrer">
          {t('campPage.turnusWebsite')}
        </a>
      )}
    </li>
  );
}
