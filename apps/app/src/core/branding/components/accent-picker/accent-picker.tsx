import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { accentColourSchema } from '@repo/schema/organisations';

import { typedColour } from '@/core/branding/components/accent-picker/accent-picker.helper';
import { AccentSwatches } from '@/core/branding/components/accent-picker/accent-swatches';
import { ColourPopover } from '@/core/branding/components/accent-picker/colour-popover';
import { cn } from '@/lib/utils';

interface AccentPickerProps {
  value: string;
  // Worn by the picker's dot while the typed colour can't be read yet.
  fallback: string;
  // A swatch, the picker and typing all report the colour here, so the form checks each the same way.
  onPick: (colour: string) => void;
}

// An accent colour: a ready-made swatch, or a colour of its own in one pill, its dot opening our picker
// beside the hex code typed by hand.
export function AccentPicker({ value, fallback, onPick }: AccentPickerProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const hintId = useId();
  const isReadable = accentColourSchema.safeParse(value).success;

  return (
    <div className="flex flex-col gap-4">
      <AccentSwatches value={value} onPick={onPick} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={inputId} className="font-semibold">
          {t('accentPicker.custom')}
        </label>
        <div className="flex h-13 items-center gap-1 rounded-full border border-input bg-input-background p-1 pr-4 transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25 has-aria-invalid:border-danger-foreground">
          <ColourPopover value={value} fallback={fallback} onPick={onPick} />
          <input
            id={inputId}
            value={value}
            onChange={(event) => onPick(typedColour(event.target.value))}
            aria-invalid={!isReadable}
            aria-describedby={hintId}
            maxLength={7}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            className="h-full w-24 min-w-0 bg-transparent font-mono text-base text-foreground uppercase outline-none disabled:cursor-not-allowed"
          />
        </div>
        <span
          id={hintId}
          className={cn('text-[13px]', isReadable ? 'text-muted-foreground' : 'font-semibold text-danger-foreground')}
        >
          {isReadable ? t('accentPicker.hint') : t('accentPicker.invalid')}
        </span>
      </div>
    </div>
  );
}
