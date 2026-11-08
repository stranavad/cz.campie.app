import { CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { brandColours } from '@repo/schema/organisations';

import { ACCENT_SWATCHES } from '@/core/branding/components/accent-picker/accent-swatches.constants';

interface AccentSwatchesProps {
  value: string;
  onPick: (colour: string) => void;
}

// The ready-made accents as a grid of colour buttons; the chosen one is ticked.
export function AccentSwatches({ value, onPick }: AccentSwatchesProps) {
  const { t } = useTranslation();
  const chosen = value.trim().toLowerCase();

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{t('accentPicker.swatches.label')}</legend>
      <div className="grid max-w-sm grid-cols-6 gap-2.5">
        {ACCENT_SWATCHES.map(([name, hex]) => (
          <button
            key={name}
            type="button"
            aria-label={t(`accentPicker.swatches.${name}`)}
            aria-pressed={chosen === hex}
            onClick={() => onPick(hex)}
            className="flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-2xl outline-offset-2 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-ring active:scale-95 disabled:cursor-not-allowed aria-pressed:outline-2 aria-pressed:outline-foreground"
            style={{ backgroundColor: hex, color: brandColours(hex).onAccent }}
          >
            {chosen === hex ? <CheckIcon aria-hidden="true" className="size-4.5" strokeWidth={3} /> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
