import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, type SelectOption } from '@/components/ui/select';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

interface SelectFieldProps {
  label: string;
  description?: string;
  // Each choice's value and its label, in order.
  options: readonly SelectOption<string>[];
  placeholder?: string;
}

export function SelectField({ label, description, options, placeholder }: SelectFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();
  const value = typeof field.state.value === 'string' && field.state.value !== '' ? field.state.value : null;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        id={id}
        name={field.name}
        value={value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onValueChange={(next) => field.handleChange(next)}
        options={options}
        aria-invalid={isInvalid}
      />
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
