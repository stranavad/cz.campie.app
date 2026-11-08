import { useId, type ReactNode } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

interface CheckboxFieldProps {
  // May hold links, such as to the document being agreed to.
  label: ReactNode;
}

export function CheckboxField({ label }: CheckboxFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();

  return (
    <Field data-invalid={isInvalid} orientation="horizontal">
      <Checkbox
        id={id}
        name={field.name}
        checked={field.state.value === true}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
      />
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor={id} className="block leading-snug font-normal">
          {label}
        </FieldLabel>
        {isInvalid && <FieldError errors={errors} />}
      </div>
    </Field>
  );
}
