import { ExternalLinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp, PublicTurnus } from '@repo/schema/camps';

import { useCampHero } from '@/core/camp-page/hooks/use-camp-hero.hook';

interface CampHeroProps {
  camp: PublicCamp;
  turnusy: readonly PublicTurnus[];
}

const CHIP =
  'inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-semibold text-foreground';

// The top of a Camp's page in its accent: its photo, logo, name, and at a glance where, for whom and how long its
// Turnusy are, with its website.
export function CampHero({ camp, turnusy }: CampHeroProps) {
  const { t } = useTranslation();
  const chips = useCampHero(turnusy);

  return (
    <section className="flex flex-col gap-3 overflow-hidden rounded-[32px] bg-brand px-5 pt-6 pb-5 text-brand-foreground sm:px-8 sm:pt-8 sm:pb-7">
      {camp.photoUrl === null ? null : (
        <img
          src={camp.photoUrl}
          alt=""
          className="-mx-5 -mt-6 mb-1 aspect-video w-[calc(100%+2.5rem)] max-w-none object-cover sm:-mx-8 sm:-mt-8 sm:aspect-[21/9] sm:w-[calc(100%+4rem)]"
        />
      )}
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
      {chips.length === 0 && camp.websiteUrl === null ? null : (
        <ul className="flex flex-wrap gap-1.5 pt-1">
          {chips.map((chip) => (
            <li key={chip} className={CHIP}>
              {chip}
            </li>
          ))}
          {camp.websiteUrl === null ? null : (
            <li className="flex">
              <a
                href={camp.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className={`${CHIP} underline-offset-4 transition-colors hover:underline`}
              >
                {t('campPage.website')}
                <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
              </a>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
