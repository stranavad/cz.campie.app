import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';

import { accentColourSchema } from '@repo/schema/organisations';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColourPopoverProps {
  value: string;
  // Shown while the typed colour can't be read yet.
  fallback: string;
  onPick: (colour: string) => void;
}

// A round swatch of the current colour that opens our own colour picker (a shade square and a hue bar),
// for any colour beyond the ready-made ones.
export function ColourPopover({ value, fallback, onPick }: ColourPopoverProps) {
  const { t } = useTranslation();
  const colour = accentColourSchema.safeParse(value).data ?? fallback;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t('accentPicker.pick')}
        className="size-11 shrink-0 cursor-pointer rounded-full border border-input p-1 transition-transform duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 data-popup-open:border-ring"
      >
        <span aria-hidden="true" className="block size-full rounded-full" style={{ backgroundColor: colour }} />
      </PopoverTrigger>
      <PopoverContent className="w-64 [&_.react-colorful]:h-48 [&_.react-colorful]:w-full [&_.react-colorful__hue]:mt-3 [&_.react-colorful__hue]:h-4 [&_.react-colorful__hue]:rounded-full [&_.react-colorful__last-control]:rounded-full [&_.react-colorful__pointer]:size-6 [&_.react-colorful__saturation]:rounded-2xl [&_.react-colorful__saturation]:border-b-0">
        <HexColorPicker color={colour} onChange={onPick} />
      </PopoverContent>
    </Popover>
  );
}
