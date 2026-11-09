import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, TentIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp } from '@repo/schema/camps';

import { buttonVariants } from '@/components/ui/button';
import { brandAttributes } from '@/core/branding';

interface CampCardProps {
  camp: PublicCamp;
}

// A Camp on the landing as one large tappable card in its own accent, leading to its page.
export function CampCard({ camp }: CampCardProps) {
  const { t } = useTranslation('campPages');

  return (
    <li {...brandAttributes(camp.accentColour)}>
      <Link
        to="/organisation/$campSlug"
        params={{ campSlug: camp.slug }}
        className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-card transition-colors hover:border-control"
      >
        <span className="flex h-37.5 items-center justify-center bg-brand text-brand-foreground">
          {camp.logoUrl === null ? (
            <TentIcon aria-hidden="true" className="size-10" />
          ) : (
            <img
              src={camp.logoUrl}
              alt=""
              height={80}
              className="h-20 w-auto max-w-[70%] rounded-2xl bg-logo-plate object-contain p-2"
            />
          )}
        </span>
        <span className="flex flex-1 flex-col gap-2.5 p-4.5">
          <span className="font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] break-words">
            {camp.name}
          </span>
          <span className={buttonVariants({ variant: 'brand', className: 'mt-auto self-end' })}>
            {t('show')}
            <ArrowRightIcon aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </Link>
    </li>
  );
}
