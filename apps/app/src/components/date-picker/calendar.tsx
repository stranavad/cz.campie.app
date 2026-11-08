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
}

const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(new Date(2000, month, 1)),
);

// One month of days, Monday first. The month and the year are our own selects, so a birth date ten years
// back is two picks away instead of a hundred clicks.
export function Calendar({ selected, onSelect, min, max }: CalendarProps) {
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
          size="icon-sm"
          aria-label={t('datePicker.previousMonth')}
          disabled={isFirst}
          onClick={() => show(month.getFullYear(), month.getMonth() - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <div className="flex min-w-0 flex-1 justify-center gap-1">
          <Select
            variant="chip"
            aria-label={t('datePicker.month')}
            value={month.getMonth()}
            onValueChange={(monthIndex) => show(month.getFullYear(), monthIndex)}
            options={MONTH_NAMES.map((name, index) => ({ value: index, label: name }))}
          />
          <Select
            variant="chip"
            aria-label={t('datePicker.year')}
            value={month.getFullYear()}
            onValueChange={(year) => show(year, month.getMonth())}
            options={Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
              const year = lastYear - index;

              return { value: year, label: String(year) };
            })}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('datePicker.nextMonth')}
          disabled={isLast}
          onClick={() => show(month.getFullYear(), month.getMonth() + 1)}
        >
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      </div>
      <DayPicker
        mode="single"
        required
        locale={cs}
        weekStartsOn={1}
        showOutsideDays
        fixedWeeks
        hideNavigation
        selected={selected}
        onSelect={onSelect}
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
          weekday: 'flex-1 pb-1 text-center text-xs font-semibold text-subtle-foreground',
          week: 'flex',
          day: 'group/day flex flex-1 justify-center p-0.5',
          day_button:
            'flex size-10 cursor-pointer items-center justify-center rounded-full text-sm tabular-nums transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:hover:bg-transparent sm:size-9',
          today: 'font-bold [&>button]:text-brand-text',
          selected: 'font-bold [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/85',
          outside: '[&>button]:text-subtle-foreground/70',
          disabled: '[&>button]:opacity-35',
          hidden: 'invisible',
        }}
      />
    </div>
  );
}
