import { useTranslation } from 'react-i18next';

import { useAccentCheck } from '@/core/branding/components/use-accent-check.hook';

interface AccentCheckProps {
  accentColour: string;
}

// What we derive from an accent so it always reads: the text colour on its buttons with their contrast,
// and the shade worn in the dark theme. Nothing while the typed colour can't be read yet.
export function AccentCheck({ accentColour }: AccentCheckProps) {
  const { t } = useTranslation();
  const check = useAccentCheck(accentColour);

  if (check === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-[18px] bg-muted px-4 py-3.5 text-sm">
      <p className="flex flex-wrap items-center gap-x-2.5">
        <span className="flex flex-1 flex-wrap gap-x-1">
          {t('accentCheck.buttonText')}
          <strong>{check.hasLightText ? t('accentCheck.white') : t('accentCheck.dark')}</strong>
        </span>
        <span className="text-muted-foreground">{t('accentCheck.contrast', { ratio: check.contrast })}</span>
      </p>
      <p className="flex flex-wrap items-center gap-x-2.5">
        <span className="flex flex-1 items-center gap-2">
          {t('accentCheck.darkShade')}
          {/* A colour shown as itself, not a theme token. */}
          <span aria-hidden="true" className="size-3 rounded-[4px]" style={{ backgroundColor: check.darkAccent }} />
        </span>
        <span className="text-muted-foreground">{t('accentCheck.automatic')}</span>
      </p>
    </div>
  );
}
