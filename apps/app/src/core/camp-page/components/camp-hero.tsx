import { ExternalLinkIcon, MapPinIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp, PublicTurnus } from '@repo/schema/camps';

import { placesOf } from '@/core/camp-page/helpers/camp-page.helper';

interface CampHeroProps {
  camp: PublicCamp;
  turnusy: readonly PublicTurnus[];
}

const CHIP =
  'inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-semibold text-foreground';

// The top of a Camp's page in its accent: logo, name, where its Turnusy take place and its website.
export function CampHero({ camp, turnusy }: CampHeroProps) {
  const { t } = useTranslation();
  const places = placesOf(turnusy);

  return (
    <section className="flex flex-col gap-4 rounded-[32px] bg-brand px-5 pt-6 pb-5 text-brand-foreground sm:px-8 sm:pt-8 sm:pb-7">
      {camp.logoUrl === null ? null : (
        <img
          src={camp.logoUrl}
          alt=""
          height={56}
          className="h-14 w-auto max-w-40 self-start rounded-2xl bg-logo-plate object-contain p-1.5"
        />
      )}
      <h1 className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] break-words sm:text-5xl">
        {camp.name}
      </h1>
      {places.length === 0 && camp.websiteUrl === null ? null : (
        <div className="flex flex-wrap gap-1.5">
          {places.map((place) => (
            <span key={place} className={CHIP}>
              <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
              {place}
            </span>
          ))}
          {camp.websiteUrl === null ? null : (
            <a
              href={camp.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className={`${CHIP} underline-offset-4 transition-colors hover:underline`}
            >
              {t('campPage.website')}
              <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
