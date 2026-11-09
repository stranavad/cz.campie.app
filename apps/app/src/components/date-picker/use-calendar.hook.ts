import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MONTHS } from '@/components/date-picker/date-picker.constant';
import { clampMonth } from '@/components/date-picker/date-picker.helper';

interface CalendarOptions {
  selected: Date | undefined;
  onSelect: (date: Date) => void;
  min?: Date;
  max?: Date;
}

// The month a calendar shows and the months and years it can browse to.
export function useCalendar({ selected, onSelect, min, max }: CalendarOptions) {
  const { t, i18n } = useTranslation();
  // Read once, when the calendar opens.
  const [today] = useState(() => new Date());
  // The years offered: the allowed range, or a century back and ten years ahead, always taking in the
  // picked day so a date saved outside them still shows its year.
  const firstYear = Math.min(min?.getFullYear() ?? today.getFullYear() - 100, selected?.getFullYear() ?? Infinity);
  const lastYear = Math.max(max?.getFullYear() ?? today.getFullYear() + 10, selected?.getFullYear() ?? -Infinity);
  // Browsing stays within those years; only min and max make days unpickable.
  const start = min ?? new Date(firstYear, 0, 1);
  const end = max ?? new Date(lastYear, 11, 31);
  const [month, setMonth] = useState(() => clampMonth(selected ?? today, start, end));
  const show = (year: number, monthIndex: number) => setMonth(clampMonth(new Date(year, monthIndex, 1), start, end));

  return {
    month,
    setMonth,
    start,
    end,
    show,
    // Capitalised, as they stand alone in the caption and the month select.
    monthNames: MONTHS.map((index) => {
      const name = t('datePicker.monthName', { date: new Date(2000, index, 1) });

      return name.charAt(0).toLocaleUpperCase(i18n.language) + name.slice(1);
    }),
    // Newest first.
    years: Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index),
    isFirst: clampMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1), start, end) >= month,
    isLast: clampMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1), start, end) <= month,
    disabled: [...(min === undefined ? [] : [{ before: min }]), ...(max === undefined ? [] : [{ after: max }])],
    select: (date: Date) => {
      setMonth(clampMonth(date, start, end));
      onSelect(date);
    },
  };
}
