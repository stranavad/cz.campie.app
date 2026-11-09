import { useTranslation } from 'react-i18next';

import { chosenOption, isEmpty, withOptionLabels, type AnswerValue, type FormField } from '@repo/schema/form-engine';
import { czechDate } from '@repo/schema/shared';

const isDate = (field: FormField) =>
  (field.tier === 'core' && field.key === 'birthDate') || (field.tier === 'custom' && field.field.type === 'date');

// An answer in words as the guardian gave it, to read it back: options by their names, yes or no, dates
// the Czech way; null for no answer.
export function useAnswerText() {
  const { t } = useTranslation();

  return (field: FormField, value: AnswerValue | undefined): string | null => {
    if (value === undefined || isEmpty(value)) {
      return null;
    }

    const option = chosenOption(field, value);

    if (option !== null) {
      return (
        option.label ?? (option.labelKey === null ? option.value : t(option.labelKey, { defaultValue: option.value }))
      );
    }

    const shown = field.tier === 'custom' ? withOptionLabels(field.field, value) : value;

    if (typeof shown === 'boolean') {
      return t(shown ? 'form.yes' : 'form.no');
    }

    if (Array.isArray(shown)) {
      return shown.join(', ');
    }

    return isDate(field) && typeof shown === 'string' ? czechDate(shown) : String(shown);
  };
}
