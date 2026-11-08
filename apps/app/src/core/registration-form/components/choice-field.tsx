import { ChoiceChips } from '@/core/registration-form/components/choice-chips';
import type { FieldInputProps } from '@/core/registration-form/components/field-input';
import { useChoices } from '@/core/registration-form/hooks/use-choices.hook';

interface ChoiceFieldProps extends FieldInputProps {
  caption: string;
}

// A choice or a yes/no as chips, each with what it adds to or takes off the price.
export function ChoiceField({ field, caption, value, onChange, invalid, describedBy }: ChoiceFieldProps) {
  const { choices, multiple, hint } = useChoices(field, value, onChange);

  return (
    <ChoiceChips
      caption={caption}
      choices={choices}
      multiple={multiple}
      hint={hint}
      invalid={invalid}
      describedBy={describedBy}
    />
  );
}
