import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cs } from 'react-day-picker/locale';
import { useTranslation } from 'react-i18next';

import { CalendarDayButton } from '@/components/date-picker/calendar-day-button';
import { CALENDAR_CLASS_NAMES } from '@/components/date-picker/date-picker.constant';
import { useCalendar } from '@/components/date-picker/use-calendar.hook';
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

// One month of days, Monday first, between the previous and next month arrows; always six weeks tall, so the
// arrows stay put while clicking through months.
export function Calendar({ selected, onSelect, min, max, yearSelect = false, unavailableHint }: CalendarProps) {
  const { t } = useTranslation();
  const calendar = useCalendar({ selected, onSelect, min, max });
  const { month } = calendar;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:size-10"
          aria-label={t('datePicker.previousMonth')}
          disabled={calendar.isFirst}
          onClick={() => calendar.show(month.getFullYear(), month.getMonth() - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
        </Button>
        {yearSelect ? (
          <div className="grid min-w-0 flex-1 grid-cols-[2fr_1fr] gap-2">
            <Select
              aria-label={t('datePicker.month')}
              className="h-11 px-3 font-semibold sm:h-10"
              value={month.getMonth()}
              onValueChange={(monthIndex) => calendar.show(month.getFullYear(), monthIndex)}
              options={calendar.monthNames.map((name, index) => ({ value: index, label: name }))}
            />
            <Select
              aria-label={t('datePicker.year')}
              className="h-11 px-3 font-semibold tabular-nums sm:h-10"
              value={month.getFullYear()}
              onValueChange={(year) => calendar.show(year, month.getMonth())}
              options={calendar.years.map((year) => ({ value: year, label: String(year) }))}
            />
          </div>
        ) : (
          <span aria-live="polite" className="min-w-0 flex-1 text-center font-display text-lg font-bold">
            {t('datePicker.monthCaption', { month: calendar.monthNames[month.getMonth()], year: month.getFullYear() })}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:size-10"
          aria-label={t('datePicker.nextMonth')}
          disabled={calendar.isLast}
          onClick={() => calendar.show(month.getFullYear(), month.getMonth() + 1)}
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
        fixedWeeks
        hideNavigation
        selected={selected}
        onSelect={calendar.select}
        month={month}
        onMonthChange={calendar.setMonth}
        startMonth={calendar.start}
        endMonth={calendar.end}
        disabled={calendar.disabled}
        classNames={CALENDAR_CLASS_NAMES}
        components={{ DayButton: CalendarDayButton }}
      />
      {unavailableHint === undefined ? null : <p className="text-xs text-muted-foreground">{unavailableHint}</p>}
    </div>
  );
}
