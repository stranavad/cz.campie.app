import { useTranslation } from 'react-i18next';

import type { AnswerValue } from '@repo/schema/form-engine';
import type { AnswerRow } from '@repo/schema/registrations';

// How an answer reads in the detail: its field's label and its value in words.
export function useAnswerText() {
  const { t } = useTranslation('participants');
  const { t: tCommon } = useTranslation();
  const shown = (value: AnswerValue) =>
    value === null
      ? t('detail.unanswered')
      : typeof value === 'boolean'
        ? t(value ? 'detail.yes' : 'detail.no')
        : Array.isArray(value)
          ? value.join(', ')
          : String(value);

  return {
    // A standard choice by its option's name: a boarding place's own, the platform's translated.
    answerText: (row: AnswerRow) =>
      row.option === null
        ? shown(row.value)
        : (row.option.label ?? tCommon(row.option.labelKey ?? '', { defaultValue: String(row.value) })),
    answerLabel: (row: AnswerRow) => {
      const label = row.label ?? (row.labelKey === null ? row.key : tCommon(row.labelKey, { defaultValue: row.key }));

      return row.state === 'answered' ? label : t(`detail.state.${row.state}`, { label });
    },
  };
}
