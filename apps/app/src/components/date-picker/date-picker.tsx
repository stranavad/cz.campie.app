import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { Calendar } from '@/components/date-picker/calendar';
import { dateFromIso, isoFromDate } from '@/components/date-picker/date-picker.helper';
import { Button } from '@/components/ui/button';
import { controlClassName } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  // The date as `YYYY-MM-DD`; empty when none is picked.
  value: string;
  onChange: (value: string) => void;
  // Called once the calendar closes, so a form marks the field visited after the pick, not before it.
  onBlur?: () => void;
  // The earliest and latest days to offer, as `YYYY-MM-DD`.
  min?: string;
  max?: string;
  // Offers to empty an optional date.
  clearable?: boolean;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

// A date field that opens our own calendar instead of the browser's, shown in Czech as "3. 7. 2027".
export function DatePicker({
  value,
  onChange,
  onBlur,
  min,
  max,
  clearable = false,
  placeholder,
  id,
  disabled,
  className,
  ...aria
}: DatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const selected = dateFromIso(value);
  const close = () => {
    setOpen(false);
    onBlur?.();
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open);

        if (!open) {
          onBlur?.();
        }
      }}
    >
      <PopoverTrigger
        id={id}
        disabled={disabled}
        data-slot="date-picker"
        className={cn(
          controlClassName,
          'flex h-12 cursor-pointer items-center justify-between gap-2 text-left font-normal data-popup-open:border-ring sm:h-11',
          className,
        )}
        {...aria}
      >
        <span className={cn('min-w-0 truncate tabular-nums', selected === undefined && 'text-subtle-foreground')}>
          {selected === undefined ? (placeholder ?? t('datePicker.placeholder')) : czechDate(value)}
        </span>
        <CalendarIcon aria-hidden="true" className="size-4 shrink-0 text-subtle-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[20rem]">
        <Calendar
          selected={selected}
          min={min === undefined ? undefined : dateFromIso(min)}
          max={max === undefined ? undefined : dateFromIso(max)}
          onSelect={(date) => {
            onChange(isoFromDate(date));
            close();
          }}
        />
        {clearable && selected !== undefined ? (
          <div className="mt-2 flex justify-end border-t border-border-subtle pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('');
                close();
              }}
            >
              {t('datePicker.clear')}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
