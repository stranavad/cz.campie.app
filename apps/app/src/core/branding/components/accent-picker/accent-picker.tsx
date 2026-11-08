import type { ReactNode } from 'react';

import { AccentSwatches } from '@/core/branding/components/accent-picker/accent-swatches';
import { ColourPopover } from '@/core/branding/components/accent-picker/colour-popover';

interface AccentPickerProps {
  value: string;
  // Worn by the picker's swatch while the typed colour can't be read yet.
  fallback: string;
  onPick: (colour: string) => void;
  // The colour as text, typed by hand: the form's own field, beside the picker's swatch.
  textField: ReactNode;
}

// An accent colour: a ready-made swatch, any colour from our picker, or a hex code typed in.
export function AccentPicker({ value, fallback, onPick, textField }: AccentPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccentSwatches value={value} onPick={onPick} />
      <div className="flex items-start gap-3">
        {/* Lines up with the text input under the field's label. */}
        <div className="pt-[25px]">
          <ColourPopover value={value} fallback={fallback} onPick={onPick} />
        </div>
        <div className="min-w-0 flex-1">{textField}</div>
      </div>
    </div>
  );
}
