import { useTranslation } from 'react-i18next';

import { fieldErrors } from '@/core/form/field-errors.helper';
import { useFieldContext } from '@/core/form/form.context';

// The current field's errors as texts to show, once the user has left it or submitted.
export function useFieldErrors() {
  const { t, i18n } = useTranslation();
  const field = useFieldContext<unknown>();
  const { errors, isTouched } = field.state.meta;
  const shown = isTouched || field.form.state.submissionAttempts > 0 ? errors : [];

  return { field, errors: fieldErrors(t, (key) => i18n.exists(key), shown), isInvalid: shown.length > 0 };
}
