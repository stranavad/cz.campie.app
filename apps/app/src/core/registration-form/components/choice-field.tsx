import { useId } from 'react';

import type { RegistrationFieldProps } from '@/core/registration-form/components/registration-field';
import { useChoices } from '@/core/registration-form/hooks/use-choices.hook';

interface ChoiceFieldProps extends Omit<RegistrationFieldProps, 'message' | 'note'> {
  caption: string;
}

// A choice or a yes/no as radios or checkboxes, each with what it adds to or takes off the price.
export function ChoiceField({ field, caption, value, onChange }: ChoiceFieldProps) {
  const name = useId();
  const { choices, multiple, hint } = useChoices(field, value, onChange);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{caption}</legend>
      {choices.map((choice) => (
        <label key={choice.id} className="flex items-center gap-2 text-sm">
          <input type={multiple ? 'checkbox' : 'radio'} name={name} checked={choice.checked} onChange={choice.pick} />
          {choice.label}
        </label>
      ))}
      {hint === null ? null : <p className="text-sm text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}
