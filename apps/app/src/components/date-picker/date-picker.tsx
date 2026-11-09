import { CalendarIcon } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { czechDate } from '@repo/schema/shared';

import { Calendar } from '@/components/date-picker/calendar';
import { PICKED_CLASS_NAME, TRIGGER_CLASS_NAME } from '@/components/date-picker/date-picker.constant';
import { czechDateText, dateFromIso, isoFromDate, parseCzechDate } from '@/components/date-picker/date-picker.helper';
import { PickerInput } from '@/components/date-picker/picker-input';
import { useNarrowScreen } from '@/components/date-picker/use-narrow-screen.hook';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface DatePickerProps {
  // The date as `YYYY-MM-DD`; empty when none is picked; the typed text itself when it is no date, so the
  // form's date check rejects it and shows its error.
  value: string;
  onChange: (value: string) => void;
  // Called when the field is left or the calendar closes, so a form marks the field visited after the pick.
  onBlur?: () => void;
  // The earliest and latest days to offer, as `YYYY-MM-DD`; the others are crossed out.
  min?: string;
  max?: string;
  // Why the crossed-out days cannot be picked, shown under the calendar.
  unavailableHint?: string;
  // Month and year selects instead of arrows only, for dates years back such as a birth date.
  yearSelect?: boolean;
  // Offers to empty an optional date.
  clearable?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

// A date typed in Czech ("15. 6. 2027") or picked from our calendar instead of the browser's: a popover on a
// laptop, a sheet from the bottom on a phone.
export function DatePicker({
  value,
  onChange,
  onBlur,
  min,
  max,
  unavailableHint,
  yearSelect,
  clearable = false,
  id,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  ...aria
}: DatePickerProps) {
  const { t } = useTranslation();
  const isNarrow = useNarrowScreen();
  const input = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
  // On a phone the day waits in the sheet until "Použít"; the sheet is titled with the field's label.
  const [draft, setDraft] = useState<Date | undefined>(undefined);
  const [title, setTitle] = useState('');
  const selected = dateFromIso(value);
  const calendarProps = {
    min: min === undefined ? undefined : dateFromIso(min),
    max: max === undefined ? undefined : dateFromIso(max),
    yearSelect,
    unavailableHint,
  };
  const changeOpen = (open: boolean) => {
    if (open) {
      setDraft(selected);
      setTitle(input.current?.labels?.[0]?.textContent ?? t('datePicker.title'));
    }

    setOpen(open);

    if (!open) {
      onBlur?.();
    }
  };
  const field = (trigger: ReactNode) => (
    <PickerInput
      inputRef={input}
      id={id}
      text={czechDateText(value)}
      placeholder={t('datePicker.placeholder')}
      onCommit={(typed) => {
        const text = typed.trim();

        onChange(text === '' ? '' : (parseCzechDate(text, new Date().getFullYear()) ?? text));
      }}
      onBlur={onBlur}
      trigger={trigger}
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid === true || (value !== '' && selected === undefined)}
      {...aria}
    />
  );

  if (isNarrow) {
    return (
      <Sheet open={isOpen} onOpenChange={changeOpen}>
        {field(
          <SheetTrigger disabled={disabled} aria-label={t('datePicker.open')} className={TRIGGER_CLASS_NAME}>
            <CalendarIcon aria-hidden="true" />
          </SheetTrigger>,
        )}
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <Calendar selected={draft} onSelect={setDraft} {...calendarProps} />
          <Button
            type="button"
            size="lg"
            className={PICKED_CLASS_NAME}
            disabled={draft === undefined}
            onClick={() => {
              if (draft !== undefined) {
                onChange(isoFromDate(draft));
              }

              changeOpen(false);
            }}
          >
            {draft === undefined
              ? t('datePicker.pickDay')
              : t('datePicker.apply', { date: czechDate(isoFromDate(draft)) })}
          </Button>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      {field(
        <PopoverTrigger disabled={disabled} aria-label={t('datePicker.open')} className={TRIGGER_CLASS_NAME}>
          <CalendarIcon aria-hidden="true" />
        </PopoverTrigger>,
      )}
      <PopoverContent
        align="end"
        aria-label={t('datePicker.calendar')}
        className="flex w-[21.25rem] flex-col gap-2.5 p-4"
      >
        <Calendar selected={selected} onSelect={(date) => onChange(isoFromDate(date))} {...calendarProps} />
        <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
          {clearable ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={value === ''}
              onClick={() => onChange('')}
            >
              {t('datePicker.clear')}
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" size="sm" className={PICKED_CLASS_NAME} onClick={() => changeOpen(false)}>
            {t('datePicker.done')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
