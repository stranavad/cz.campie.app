import { useId, type ReactNode } from 'react';

import type { Choice } from '@/core/registration-form/hooks/use-choices.hook';
import { cn } from '@/lib/utils';

interface ChoiceChipsProps {
  caption: ReactNode;
  choices: readonly Choice[];
  multiple: boolean;
  hint?: string | null;
  invalid?: boolean;
  describedBy?: string;
}

// Options as tappable chips: real radios or checkboxes underneath, so keyboards and screen readers work as
// with any choice; the checked one is outlined and tinted with the accent.
export function ChoiceChips({
  caption,
  choices,
  multiple,
  hint = null,
  invalid = false,
  describedBy,
}: ChoiceChipsProps) {
  const name = useId();

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" aria-describedby={describedBy}>
      <legend className="mb-2 text-sm leading-snug font-semibold">{caption}</legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <label
            key={choice.id}
            className={cn(
              'flex min-h-12 min-w-16 cursor-pointer items-center justify-center rounded-[14px] border bg-input-background px-4 py-2 text-center text-[15px] leading-snug font-medium transition-colors hover:bg-muted has-checked:border-2 has-checked:border-foreground has-checked:bg-brand-soft has-checked:px-[15px] has-checked:font-bold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
              invalid ? 'border-danger-foreground' : 'border-input',
            )}
          >
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              className="sr-only"
              checked={choice.checked}
              aria-invalid={invalid || undefined}
              onChange={choice.pick}
              onClick={choice.checked && choice.clear !== null ? choice.clear : undefined}
            />
            {choice.label}
          </label>
        ))}
      </div>
      {hint === null ? null : <p className="text-[13px] text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}
