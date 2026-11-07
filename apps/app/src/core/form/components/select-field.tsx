import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

interface SelectFieldProps {
  label: string;
  description?: string;
  // Each choice's value and its label, in order.
  options: readonly { readonly value: string; readonly label: string }[];
}

// A native select, so phones show their own picker.
export function SelectField({ label, description, options }: SelectFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        name={field.name}
        value={typeof field.state.value === 'string' ? field.state.value : ''}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
