import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_TIME } from '@/components/date-picker/date-picker.constant';
import {
  czechDateTimeText,
  dateFromIso,
  isoFromDate,
  parseCzechDateTime,
} from '@/components/date-picker/date-picker.helper';
import { usePickerPopup } from '@/components/date-picker/use-picker-popup.hook';

interface DateTimePickerOptions {
  // `YYYY-MM-DDTHH:mm`, empty, or typed text that is no date with a time.
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

interface Draft {
  date: Date | undefined;
  // `HH:mm`.
  time: string;
}

export function useDateTimePicker({ value, onChange, onBlur }: DateTimePickerOptions) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Draft>({ date: undefined, time: DEFAULT_TIME });
  const text = czechDateTimeText(value);
  // The field shows the Czech form of a whole value; anything else is text that was typed and is no time.
  const isWhole = text !== value;
  // The pick waits in the popup until it is applied, so the value is empty or whole.
  const popup = usePickerPopup(
    t('datePicker.dateTimeTitle'),
    () => {
      const [date = '', time = ''] = value.split('T');

      setDraft(isWhole ? { date: dateFromIso(date), time: time.slice(0, 5) } : { date: undefined, time: DEFAULT_TIME });
    },
    onBlur,
  );

  return {
    popup,
    text,
    draft,
    // The draft as the field would show it, once it has a day.
    picked: draft.date === undefined ? undefined : czechDateTimeText(`${isoFromDate(draft.date)}T${draft.time}`),
    isNoTime: value !== '' && !isWhole,
    pickDate: (date: Date) => setDraft({ ...draft, date }),
    pickTime: (time: string) => setDraft({ ...draft, time }),
    commit: (typed: string) => {
      const trimmed = typed.trim();

      onChange(trimmed === '' ? '' : (parseCzechDateTime(trimmed, new Date().getFullYear()) ?? trimmed));
    },
    apply: () => {
      if (draft.date !== undefined) {
        onChange(`${isoFromDate(draft.date)}T${draft.time}`);
      }

      popup.changeOpen(false);
    },
    clear: () => {
      onChange('');
      popup.changeOpen(false);
    },
  };
}
