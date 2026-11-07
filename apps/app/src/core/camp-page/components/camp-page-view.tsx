import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp, PublicTurnus } from '@repo/schema/camps';

import { TurnusCard } from '@/core/camp-page/components/turnus-card';
import { brandTokens } from '@/core/organisation-shell/brand-tokens.helper';

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
    <div className="flex flex-col gap-6 py-8" style={brandTokens(camp.accentColour)}>
      <header className="flex flex-wrap items-center gap-4 border-b-4 border-primary pb-4">
        {camp.logoUrl === null ? null : <img src={camp.logoUrl} alt="" className="h-14 w-auto" />}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{camp.name}</h1>
          {camp.websiteUrl === null ? null : (
            <a href={camp.websiteUrl} className="text-sm underline" target="_blank" rel="noreferrer">
              {t('campPage.website')}
            </a>
          )}
        </div>
      </header>
      <h2 className="text-lg font-semibold">{t('campPage.turnusy')}</h2>
      {turnusy.length === 0 ? <p className="text-muted-foreground">{t('campPage.noTurnusy')}</p> : null}
      <ul className="flex flex-col gap-4">
        {turnusy.map((turnus) => (
          <TurnusCard key={turnus.id} turnus={turnus} action={actionOf?.(turnus)} />
        ))}
      </ul>
    </div>
  );
}
