import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicCamp } from '@repo/schema/camps';

import { buttonVariants } from '@/components/ui/button';
import { brandAttributes } from '@/core/branding';
import { CampCardPicture } from '@/features/camp-pages/components/camp-card-picture';

interface CampCardProps {
  camp: PublicCamp;
}

// A Camp on the landing as one large tappable card in its own accent, with its photo and the start of its
// description, leading to its page.
export function CampCard({ camp }: CampCardProps) {
  const { t } = useTranslation('campPages');

  return (
    <li {...brandAttributes(camp.accentColour)}>
      <Link
        to="/organisation/$campSlug"
        params={{ campSlug: camp.slug }}
        className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-card transition-colors hover:border-control"
      >
        <CampCardPicture camp={camp} />
        <span className="flex flex-1 flex-col gap-2.5 p-4.5">
          <span className="font-display text-2xl leading-tight font-extrabold tracking-[-0.02em] break-words">
            {camp.name}
          </span>
          {camp.description === null ? null : (
            // Plain text: its line breaks are kept, nothing in it is read as markup.
            <span className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">{camp.description}</span>
          )}
          <span className={buttonVariants({ variant: 'brand', className: 'mt-auto self-end' })}>
            {t('show')}
            <ArrowRightIcon aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </Link>
    </li>
  );
}
