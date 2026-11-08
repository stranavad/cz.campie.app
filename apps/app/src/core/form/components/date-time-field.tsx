import { useId } from 'react';

import { DateTimePicker } from '@/components/date-picker/date-time-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

interface DateTimeFieldProps {
  label: string;
  description?: string;
  clearable?: boolean;
}

// A `YYYY-MM-DDTHH:mm` string field: a day from our calendar and a time.
export function DateTimeField({ label, description, clearable }: DateTimeFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <DateTimePicker
        id={id}
        value={typeof field.state.value === 'string' ? field.state.value : ''}
        onChange={(next) => field.handleChange(next)}
        onBlur={field.handleBlur}
        clearable={clearable}
        aria-invalid={isInvalid}
      />
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
