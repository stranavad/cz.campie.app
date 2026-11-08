import { useId, type ComponentProps, type ReactNode } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldErrors } from '@/core/form/hooks/use-field-errors.hook';

type TextFieldProps = Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'value' | 'onChange' | 'onBlur'> & {
  label: string;
  description?: string;
  // Text inside the box after what the user types, such as the platform domain after a subdomain.
  suffix?: ReactNode;
};

export function TextField({ label, description, suffix, ...props }: TextFieldProps) {
  const { field, errors, isInvalid } = useFieldErrors();
  const id = useId();
  const input = (
    <Input
      id={id}
      name={field.name}
      value={typeof field.state.value === 'string' ? field.state.value : ''}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      aria-invalid={isInvalid}
      {...props}
    />
  );

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {suffix === undefined ? (
        input
      ) : (
        // The box's edge and focus ring move to the wrapper, so input and suffix read as one field.
        <div className="flex min-w-0 items-center rounded-2xl border border-input bg-input-background pr-4 transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25 has-aria-invalid:border-2 has-aria-invalid:border-danger-foreground has-aria-invalid:pr-[15px] [&>input]:min-w-0 [&>input]:flex-1 [&>input]:border-0 [&>input]:bg-transparent [&>input]:pr-1 [&>input]:focus-visible:ring-0 [&>input]:aria-invalid:border-0 [&>input]:aria-invalid:pl-[15px]">
          {input}
          <span className="shrink-0 text-muted-foreground">{suffix}</span>
        </div>
      )}
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
