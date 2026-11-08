import { useTranslation } from 'react-i18next';

import { accentColourSchema } from '@repo/schema/organisations';

import { AccentSample } from '@/core/branding/components/accent-sample';

interface AccentPreviewProps {
  accentColour: string;
}

// How the accent will look in the light and the dark theme, side by side, with the colours derived for
// each. Each sample sits under a `light` or `dark` class, which fixes the theme tokens for its subtree.
export function AccentPreview({ accentColour }: AccentPreviewProps) {
  const { t } = useTranslation();
  const parsed = accentColourSchema.safeParse(accentColour);

  if (!parsed.success) {
    return null;
  }

  return (
    <div className="grid gap-3 min-[440px]:grid-cols-2">
      <div className="light rounded-2xl">
        <AccentSample accentColour={parsed.data} label={t('accentPreview.light')} />
      </div>
      <div className="dark rounded-2xl">
        <AccentSample accentColour={parsed.data} label={t('accentPreview.dark')} />
      </div>
    </div>
  );
}
