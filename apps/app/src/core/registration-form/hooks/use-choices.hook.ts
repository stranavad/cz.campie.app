import { useTranslation } from 'react-i18next';

import type { AnswerValue, FormField } from '@repo/schema/form-engine';

export interface Choice {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly pick: () => void;
}

// A choice field's options, or yes and no, with their surcharges, which are checked and what picking does.
export function useChoices(field: FormField, value: AnswerValue | undefined, onChange: (value: AnswerValue) => void) {
  const { t } = useTranslation();
  const surcharge = (amount: number | null) =>
    amount === null || amount === 0
      ? ''
      : ` (${t(amount > 0 ? 'form.surchargeExtra' : 'form.surchargeDiscount', { amount: Math.abs(amount) })})`;

  if (field.tier !== 'custom') {
    return { choices: [], multiple: false, hint: null };
  }

  const custom = field.field;

  if (custom.type === 'yes_no') {
    const choices: Choice[] = [
      {
        id: 'yes',
        label: t('form.yes') + surcharge(custom.surcharge),
        checked: value === true,
        pick: () => onChange(true),
      },
      { id: 'no', label: t('form.no'), checked: value === false, pick: () => onChange(false) },
    ];

    return { choices, multiple: false, hint: custom.hint };
  }

  if (custom.type !== 'single_choice' && custom.type !== 'multiple_choice') {
    return { choices: [], multiple: false, hint: custom.hint };
  }

  const multiple = custom.type === 'multiple_choice';
  const chosen = Array.isArray(value) ? value : [];
  const choices: Choice[] = custom.options.map((option) => {
    const checked = multiple ? chosen.includes(option.id) : value === option.id;

    return {
      id: option.id,
      label: option.label + surcharge(option.surcharge),
      checked,
      pick: () =>
        onChange(multiple ? (checked ? chosen.filter((id) => id !== option.id) : [...chosen, option.id]) : option.id),
    };
  });

  return { choices, multiple, hint: custom.hint };
}
