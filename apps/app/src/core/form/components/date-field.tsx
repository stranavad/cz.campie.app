import { useId } from 'react';

import { DatePicker } from '@/components/date-picker/date-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

interface DateFieldProps {
  label: string;
  description?: string;
  // Offers to empty an optional date.
  clearable?: boolean;
  // The earliest and latest days to offer, as `YYYY-MM-DD`.
  min?: string;
  max?: string;
  className?: string;
}

// A `YYYY-MM-DD` string field, picked from our calendar.
export function DateField({ label, description, clearable, min, max, className }: DateFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <DatePicker
        id={id}
        value={typeof field.state.value === 'string' ? field.state.value : ''}
        onChange={(next) => field.handleChange(next)}
        onBlur={field.handleBlur}
        clearable={clearable}
        min={min}
        max={max}
        className={className}
        aria-invalid={isInvalid}
      />
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
