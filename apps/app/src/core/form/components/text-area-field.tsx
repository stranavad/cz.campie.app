import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
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
      <Textarea
        id={id}
        name={field.name}
        rows={rows}
        value={typeof field.state.value === 'string' ? field.state.value : ''}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
      />
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
