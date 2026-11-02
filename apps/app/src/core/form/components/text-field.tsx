import { useId, type ComponentProps } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

type TextFieldProps = Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'value' | 'onChange' | 'onBlur'> & {
  label: string;
  description?: string;
};

export function TextField({ label, description, ...props }: TextFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={field.name}
        value={typeof field.state.value === 'string' ? field.state.value : ''}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
        {...props}
      />
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
