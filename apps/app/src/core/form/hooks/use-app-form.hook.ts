import { createFormHook } from '@tanstack/react-form';

import { CheckboxField } from '@/core/form/components/checkbox-field';
import { SubmitButton } from '@/core/form/components/submit-button';
import { TextField } from '@/core/form/components/text-field';
import { fieldContext, formContext } from '@/core/form/form.context';

// Register new form components here to use them as `field.X` / `form.X`.
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, CheckboxField },
  formComponents: { SubmitButton },
});
