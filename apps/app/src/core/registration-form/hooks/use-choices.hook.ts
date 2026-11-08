import { useTranslation } from 'react-i18next';

import type { AnswerValue, FormField } from '@repo/schema/form-engine';

export interface Choice {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly pick: () => void;
  // Takes an optional answer back when its checked option is picked again; null where it cannot be.
  readonly clear: (() => void) | null;
}

// A choice field's options, or yes and no, with their surcharges, which are checked and what picking does.
// A standard choice offers its platform and camp options; an optional one can be taken back.
export function useChoices(field: FormField, value: AnswerValue | undefined, onChange: (value: AnswerValue) => void) {
  const { t } = useTranslation();
  const surcharge = (amount: number | null) =>
    amount === null || amount === 0
      ? ''
      : ` (${t(amount > 0 ? 'form.surchargeExtra' : 'form.surchargeDiscount', { amount: Math.abs(amount) })})`;

  if (field.tier === 'standard') {
    const choices: Choice[] = field.options.map((option) => ({
      id: option.value,
      label:
        option.label ?? (option.labelKey === null ? option.value : t(option.labelKey, { defaultValue: option.value })),
      checked: value === option.value,
      pick: () => onChange(option.value),
      clear: field.required ? null : () => onChange(null),
    }));

    return { choices, multiple: false, hint: null };
  }

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
        clear: null,
      },
      { id: 'no', label: t('form.no'), checked: value === false, pick: () => onChange(false), clear: null },
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
      clear: null,
    };
  });

  return { choices, multiple, hint: custom.hint };
}
