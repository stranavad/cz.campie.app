import { createFormHook } from '@tanstack/react-form';

import { CheckboxField } from '@/core/form/components/checkbox-field';
import { SelectField } from '@/core/form/components/select-field';
import { SubmitButton } from '@/core/form/components/submit-button';
import { TextAreaField } from '@/core/form/components/text-area-field';
import { TextField } from '@/core/form/components/text-field';
import { fieldContext, formContext } from '@/core/form/form.context';

// Register new form components here to use them as `field.X` / `form.X`.
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextAreaField, CheckboxField, SelectField },
  formComponents: { SubmitButton },
});
