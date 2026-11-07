import { useTranslation } from 'react-i18next';

import { accentColourSchema, brandColours } from '@repo/schema/organisations';

interface AccentPreviewProps {
  accentColour: string;
}

// How the accent will look on the public pages, with the text colours derived for it.
export function AccentPreview({ accentColour }: AccentPreviewProps) {
  const { t } = useTranslation();
  const parsed = accentColourSchema.safeParse(accentColour);

  if (!parsed.success) {
    return null;
  }

  const { accent, onAccent, accentText } = brandColours(parsed.data);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-4">
      <span className="rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: accent, color: onAccent }}>
        {t('accentPreview.button')}
      </span>
      <span className="text-sm font-medium underline" style={{ color: accentText }}>
        {t('accentPreview.link')}
      </span>
    </div>
  );
}
