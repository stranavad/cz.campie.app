import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { useFormContext } from '@/core/form/form.context';

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, 'type' | 'disabled'>;

/** Disabled while the form is submitting. */
export function SubmitButton(props: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <Button type="submit" disabled={isSubmitting} {...props} />}
    </form.Subscribe>
  );
}
