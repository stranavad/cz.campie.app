import { TentIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { brandAttributes } from '@/core/branding';

interface BrandPreviewProps {
  accentColour: string;
  campName: string;
  logoUrl: string | null;
  className?: string;
}

// A sketch of the Camp's public page in the accent being chosen, live as it changes.
export function BrandPreview({ accentColour, campName, logoUrl, className }: BrandPreviewProps) {
  const { t } = useTranslation('camps');

  return (
    <Card aria-label={t('branding.preview')} className={className}>
      <span className="font-semibold">{t('branding.preview')}</span>
      <div
        {...brandAttributes(accentColour)}
        className="flex flex-col gap-4 overflow-hidden rounded-[20px] border border-border bg-background pb-4"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-3.5">
          <span className="flex min-w-0 items-center gap-2.5">
            {logoUrl === null ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <TentIcon aria-hidden="true" className="size-4" />
              </span>
            ) : (
              <img
                src={logoUrl}
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full bg-logo-plate object-contain"
              />
            )}
            <span className="truncate text-sm font-bold">{campName}</span>
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-brand-text underline">
            {t('branding.previewPortal')}
          </span>
        </div>
        <div className="mx-4 rounded-[22px] bg-brand px-6 py-7 text-brand-foreground">
          <p className="font-display text-3xl leading-none font-extrabold tracking-[-0.03em] break-words">{campName}</p>
        </div>
        <div className="mx-4 flex max-w-xs flex-col gap-2.5 rounded-[18px] border border-border bg-card p-3.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-20" />
            <Badge variant="success">{t('branding.previewPlaces')}</Badge>
          </div>
          <Skeleton className="h-3 w-32" />
          <span className="flex h-9.5 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
            {t('branding.previewCta')}
          </span>
        </div>
      </div>
    </Card>
  );
}
