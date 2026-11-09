import { useId } from 'react';

import { CodeInput } from '@/components/code-input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

interface TotpDigitsFieldProps {
  label: string;
}

// The six digits from the authenticator app, as the form's `code` field.
export function TotpDigitsField({ label }: TotpDigitsFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <CodeInput
        id={id}
        value={typeof field.state.value === 'string' ? field.state.value : ''}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
