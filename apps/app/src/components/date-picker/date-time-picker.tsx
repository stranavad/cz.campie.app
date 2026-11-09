import { Clock3Icon } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Calendar } from '@/components/date-picker/calendar';
import { DEFAULT_TIME, PICKED_CLASS_NAME, TRIGGER_CLASS_NAME } from '@/components/date-picker/date-picker.constant';
import {
  czechDateTimeText,
  dateFromIso,
  isoFromDate,
  parseCzechDateTime,
} from '@/components/date-picker/date-picker.helper';
import { PickerInput } from '@/components/date-picker/picker-input';
import { TimeColumns } from '@/components/date-picker/time-columns';
import { useNarrowScreen } from '@/components/date-picker/use-narrow-screen.hook';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface DateTimePickerProps {
  // The Prague wall-clock time as `YYYY-MM-DDTHH:mm`; empty when none is picked; the typed text itself
  // when it is no date with a time, so the form's check rejects it and shows its error.
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  // Offers to empty an optional time.
  clearable?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface Draft {
  date: Date | undefined;
  // `HH:mm`.
  time: string;
}

// One field for a day and a time, typed ("5. 7. 2027 8:30") or picked in one popover: the calendar beside
// an hour column and quarter hours. The pick waits there until "Hotovo", so the value is empty or whole.
export function DateTimePicker({
  value,
  onChange,
  onBlur,
  clearable = false,
  id,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  ...aria
}: DateTimePickerProps) {
  const { t } = useTranslation();
  const isNarrow = useNarrowScreen();
  const input = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ date: undefined, time: DEFAULT_TIME });
  const [title, setTitle] = useState('');
  const text = czechDateTimeText(value);
  // The field shows the Czech form of a whole value; anything else is text that was typed and is no time.
  const isWhole = text !== value;
  const picked = draft.date === undefined ? undefined : czechDateTimeText(`${isoFromDate(draft.date)}T${draft.time}`);
  const changeOpen = (open: boolean) => {
    if (open) {
      const [date = '', time = ''] = value.split('T');

      setDraft(isWhole ? { date: dateFromIso(date), time: time.slice(0, 5) } : { date: undefined, time: DEFAULT_TIME });
      setTitle(input.current?.labels?.[0]?.textContent ?? t('datePicker.dateTimeTitle'));
    }

    setOpen(open);

    if (!open) {
      onBlur?.();
    }
  };
  const apply = () => {
    if (draft.date !== undefined) {
      onChange(`${isoFromDate(draft.date)}T${draft.time}`);
    }

    changeOpen(false);
  };
  const clear = clearable ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      disabled={value === ''}
      onClick={() => {
        onChange('');
        changeOpen(false);
      }}
    >
      {t('datePicker.clear')}
    </Button>
  ) : null;
  const calendar = <Calendar selected={draft.date} onSelect={(date) => setDraft({ ...draft, date })} />;
  const times = (compact: boolean) => (
    <TimeColumns time={draft.time} compact={compact} onChange={(time) => setDraft({ ...draft, time })} />
  );
  const field = (trigger: ReactNode) => (
    <PickerInput
      inputRef={input}
      id={id}
      text={text}
      placeholder={t('datePicker.dateTimePlaceholder')}
      onCommit={(typed) => {
        const trimmed = typed.trim();

        onChange(trimmed === '' ? '' : (parseCzechDateTime(trimmed, new Date().getFullYear()) ?? trimmed));
      }}
      onBlur={onBlur}
      trigger={trigger}
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid === true || (value !== '' && !isWhole)}
      {...aria}
    />
  );

  if (isNarrow) {
    return (
      <Sheet open={isOpen} onOpenChange={changeOpen}>
        {field(
          <SheetTrigger disabled={disabled} aria-label={t('datePicker.openWithTime')} className={TRIGGER_CLASS_NAME}>
            <Clock3Icon aria-hidden="true" />
          </SheetTrigger>,
        )}
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {calendar}
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
            <h3 className="text-lg font-bold">{t('datePicker.time')}</h3>
            {times(true)}
          </div>
          {clear}
          <Button type="button" size="lg" className={PICKED_CLASS_NAME} disabled={picked === undefined} onClick={apply}>
            {picked === undefined ? t('datePicker.pickDay') : t('datePicker.apply', { date: picked })}
          </Button>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      {field(
        <PopoverTrigger disabled={disabled} aria-label={t('datePicker.openWithTime')} className={TRIGGER_CLASS_NAME}>
          <Clock3Icon aria-hidden="true" />
        </PopoverTrigger>,
      )}
      <PopoverContent
        align="end"
        aria-label={t('datePicker.calendarWithTime')}
        className="flex w-[35rem] flex-col gap-3 p-4"
      >
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">{calendar}</div>
          <div aria-hidden="true" className="w-px bg-border-subtle" />
          <div className="flex w-38 shrink-0 flex-col gap-2">
            <h3 className="flex h-10 items-center text-lg font-bold">{t('datePicker.time')}</h3>
            {times(false)}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-2.5">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {picked === undefined ? (
              t('datePicker.pickDay')
            ) : (
              <>
                {t('datePicker.picked')} <strong className="text-foreground tabular-nums">{picked}</strong>
              </>
            )}
          </p>
          <div className="flex gap-1.5">
            {clear}
            <Button type="button" variant="outline" size="sm" onClick={() => changeOpen(false)}>
              {t('datePicker.cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              className={PICKED_CLASS_NAME}
              disabled={picked === undefined}
              onClick={apply}
            >
              {t('datePicker.done')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
