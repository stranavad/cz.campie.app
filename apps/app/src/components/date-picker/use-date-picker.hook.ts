import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { dateFromIso, isoFromDate, parseCzechDate } from '@/components/date-picker/date-picker.helper';
import { usePickerPopup } from '@/components/date-picker/use-picker-popup.hook';

interface DatePickerOptions {
  // `YYYY-MM-DD`, empty, or typed text that is no date.
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  min?: string;
  max?: string;
}

export function useDatePicker({ value, onChange, onBlur, min, max }: DatePickerOptions) {
  const { t } = useTranslation();
  const selected = dateFromIso(value);
  // On a phone the day waits in the sheet until "Použít".
  const [draft, setDraft] = useState<Date | undefined>(undefined);
  const popup = usePickerPopup(t('datePicker.title'), () => setDraft(selected), onBlur);

  return {
    popup,
    selected,
    draft,
    setDraft,
    draftText: draft === undefined ? undefined : czechDate(isoFromDate(draft)),
    bounds: {
      min: min === undefined ? undefined : dateFromIso(min),
      max: max === undefined ? undefined : dateFromIso(max),
    },
    // Text that is no date stays as typed, so the form's date check rejects it and shows its error.
    isNoDate: value !== '' && selected === undefined,
    commit: (typed: string) => {
      const text = typed.trim();

      onChange(text === '' ? '' : (parseCzechDate(text, new Date().getFullYear()) ?? text));
    },
    pick: (date: Date) => onChange(isoFromDate(date)),
    apply: () => {
      if (draft !== undefined) {
        onChange(isoFromDate(draft));
      }

      popup.changeOpen(false);
    },
    clear: () => {
      onChange('');
      popup.changeOpen(false);
    },
  };
}
