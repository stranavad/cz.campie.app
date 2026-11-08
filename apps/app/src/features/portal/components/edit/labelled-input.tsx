import { useId, type ComponentProps } from 'react';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type LabelledInputProps = Omit<ComponentProps<typeof Input>, 'id'> & { label: string };

// A plain input with its label above, for the portal's small contact forms.
export function LabelledInput({ label, ...props }: LabelledInputProps) {
  const id = useId();

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} {...props} />
    </Field>
  );
}
