import { ClipboardListIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { brandAttributes } from '@/core/branding/brand-attributes.helper';

interface AccentSampleProps {
  accentColour: string;
  // Which theme this sample shows.
  label: string;
}

// The accent on a few typical elements: the main button, a selected navigation pill and a link in text.
export function AccentSample({ accentColour, label }: AccentSampleProps) {
  const { t } = useTranslation();

  return (
    <div
      {...brandAttributes(accentColour)}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-background p-4 text-foreground"
    >
      <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
      <span className="inline-flex h-9 items-center self-start rounded-full bg-brand px-4 text-sm font-bold text-brand-foreground">
        {t('accentPreview.button')}
      </span>
      <span className="inline-flex h-9 items-center gap-2 self-start rounded-full bg-brand-soft px-3 text-sm font-semibold">
        <ClipboardListIcon aria-hidden="true" className="size-4 text-brand-soft-foreground" />
        {t('accentPreview.nav')}
      </span>
      <span className="text-sm font-semibold text-brand-text underline underline-offset-2">
        {t('accentPreview.link')}
      </span>
    </div>
  );
}
