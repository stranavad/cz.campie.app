import { useTranslation } from 'react-i18next';

import { accentColourSchema, brandColours, contrastRatio } from '@repo/schema/organisations';

const RATIO = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });

interface AccentCheckProps {
  accentColour: string;
}

// What we derive from an accent so it always reads: the text colour on its buttons with their contrast,
// and the shade worn in the dark theme. Nothing while the typed colour can't be read yet.
export function AccentCheck({ accentColour }: AccentCheckProps) {
  const { t } = useTranslation();
  const parsed = accentColourSchema.safeParse(accentColour);

  if (!parsed.success) {
    return null;
  }

  const { accent, onAccent, darkAccent } = brandColours(parsed.data);

  return (
    <div className="flex flex-col gap-2 rounded-[18px] bg-muted px-4 py-3.5 text-sm">
      <p className="flex flex-wrap items-center gap-x-2.5">
        <span className="flex flex-1 flex-wrap gap-x-1">
          {t('accentCheck.buttonText')}
          <strong>{onAccent === '#ffffff' ? t('accentCheck.white') : t('accentCheck.dark')}</strong>
        </span>
        <span className="text-muted-foreground">
          {t('accentCheck.contrast', { ratio: RATIO.format(contrastRatio(accent, onAccent)) })}
        </span>
      </p>
      <p className="flex flex-wrap items-center gap-x-2.5">
        <span className="flex flex-1 items-center gap-2">
          {t('accentCheck.darkShade')}
          {/* A colour shown as itself, not a theme token. */}
          <span aria-hidden="true" className="size-3 rounded-[4px]" style={{ backgroundColor: darkAccent }} />
        </span>
        <span className="text-muted-foreground">{t('accentCheck.automatic')}</span>
      </p>
    </div>
  );
}
