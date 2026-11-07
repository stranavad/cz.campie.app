import { useTranslation } from 'react-i18next';

import type { FormField } from '@repo/schema/form-engine';

import type common from '@/locales/cs/common.json';

type FormLabelKey = `form.core.${keyof (typeof common)['form']['core']}`;

// A field's label: the platform's text for the core and standard fields, the camp's own for custom ones.
export function useFieldLabel() {
  const { t, i18n } = useTranslation();

  return (field: FormField): string =>
    field.tier === 'custom'
      ? field.field.label
      : i18n.exists(field.labelKey)
        ? t(field.labelKey as FormLabelKey)
        : field.key;
}
