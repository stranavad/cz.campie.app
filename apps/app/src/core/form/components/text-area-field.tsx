import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

interface TextAreaFieldProps {
  label: string;
  description?: string;
  rows?: number;
}

export function TextAreaField({ label, description, rows = 4 }: TextAreaFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        name={field.name}
        rows={rows}
        value={typeof field.state.value === 'string' ? field.state.value : ''}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm"
      />
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
