import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { cs } from 'react-day-picker/locale';
import { useTranslation } from 'react-i18next';

import { clampMonth } from '@/components/date-picker/date-picker.helper';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface CalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date) => void;
  min?: Date;
  max?: Date;
  // A month and a year select instead of the month's name, for dates years back such as a birth date.
  yearSelect?: boolean;
  // Why the crossed-out days cannot be picked, shown under the days.
  unavailableHint?: string;
}

const MONTH_NAMES = Array.from({ length: 12 }, (_, month) => {
  const name = new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(new Date(2000, month, 1));

  return name.charAt(0).toUpperCase() + name.slice(1);
});

// The selected day takes the picker's action colour; today, when not picked, gets a ring.
const SELECTED =
  '[&>button]:bg-primary [&>button]:font-bold [&>button]:text-primary-foreground [&>button]:hover:bg-primary/85 in-data-[actions=brand]:[&>button]:bg-brand in-data-[actions=brand]:[&>button]:text-brand-foreground in-data-[actions=brand]:[&>button]:hover:bg-brand/85';

// One month of days, Monday first, between the previous and next month arrows.
export function Calendar({ selected, onSelect, min, max, yearSelect = false, unavailableHint }: CalendarProps) {
  const { t } = useTranslation();
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
  const isFirst = clampMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1), start, end) >= month;
  const isLast = clampMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1), start, end) <= month;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:size-10"
          aria-label={t('datePicker.previousMonth')}
          disabled={isFirst}
          onClick={() => show(month.getFullYear(), month.getMonth() - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
        </Button>
        {yearSelect ? (
          <div className="grid min-w-0 flex-1 grid-cols-[2fr_1fr] gap-2">
            <Select
              aria-label={t('datePicker.month')}
              className="h-11 px-3 font-semibold sm:h-10"
              value={month.getMonth()}
              onValueChange={(monthIndex) => show(month.getFullYear(), monthIndex)}
              options={MONTH_NAMES.map((name, index) => ({ value: index, label: name }))}
            />
            <Select
              aria-label={t('datePicker.year')}
              className="h-11 px-3 font-semibold tabular-nums sm:h-10"
              value={month.getFullYear()}
              onValueChange={(year) => show(year, month.getMonth())}
              options={Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
                const year = lastYear - index;

                return { value: year, label: String(year) };
              })}
            />
          </div>
        ) : (
          <span aria-live="polite" className="min-w-0 flex-1 text-center font-display text-lg font-bold">
            {t('datePicker.monthCaption', { month: MONTH_NAMES[month.getMonth()], year: month.getFullYear() })}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:size-10"
          aria-label={t('datePicker.nextMonth')}
          disabled={isLast}
          onClick={() => show(month.getFullYear(), month.getMonth() + 1)}
        >
          <ChevronRightIcon aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <DayPicker
        mode="single"
        required
        locale={cs}
        weekStartsOn={1}
        showOutsideDays
        hideNavigation
        selected={selected}
        onSelect={(date) => {
          setMonth(clampMonth(date, start, end));
          onSelect(date);
        }}
        month={month}
        onMonthChange={setMonth}
        startMonth={start}
        endMonth={end}
        disabled={[...(min === undefined ? [] : [{ before: min }]), ...(max === undefined ? [] : [{ after: max }])]}
        classNames={{
          root: 'w-full',
          months: 'w-full',
          month: 'w-full',
          month_caption: 'sr-only',
          month_grid: 'w-full border-collapse',
          weekdays: 'flex',
          weekday: 'flex h-7 flex-1 items-center justify-center text-xs font-bold text-subtle-foreground capitalize',
          week: 'flex',
          day: 'flex flex-1 justify-center p-px',
          day_button:
            'flex size-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-medium tabular-nums transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:hover:bg-transparent sm:size-10 sm:text-sm',
          today:
            '[&:not([data-selected])>button]:inset-ring-[1.5px] [&:not([data-selected])>button]:inset-ring-foreground',
          selected: SELECTED,
          outside: '[&>button]:text-subtle-foreground',
          disabled: '[&>button]:text-subtle-foreground [&>button]:line-through',
          hidden: 'invisible',
        }}
      />
      {unavailableHint === undefined ? null : <p className="text-xs text-muted-foreground">{unavailableHint}</p>}
    </div>
  );
}
