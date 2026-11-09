import { CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Calendar } from '@/components/date-picker/calendar';
import { PICKED_CLASS_NAME } from '@/components/date-picker/date-picker.constant';
import { czechDateText } from '@/components/date-picker/date-picker.helper';
import { PickerClearButton } from '@/components/date-picker/picker-clear-button';
import { PickerShell } from '@/components/date-picker/picker-shell';
import { useDatePicker } from '@/components/date-picker/use-date-picker.hook';
import { Button } from '@/components/ui/button';

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
  'aria-invalid': ariaInvalid,
  ...input
}: DatePickerProps) {
  const { t } = useTranslation();
  const picker = useDatePicker({ value, onChange, onBlur, min, max });
  const calendarProps = { ...picker.bounds, yearSelect, unavailableHint };
  const clear = clearable ? <PickerClearButton disabled={value === ''} onClick={picker.clear} /> : null;

  return (
    <PickerShell
      popup={picker.popup}
      input={{
        ...input,
        text: czechDateText(value),
        placeholder: t('datePicker.placeholder'),
        onCommit: picker.commit,
        onBlur,
        'aria-invalid': ariaInvalid === true || picker.isNoDate,
      }}
      icon={<CalendarIcon aria-hidden="true" />}
      openLabel={t('datePicker.open')}
      sheet={
        <>
          <Calendar selected={picker.draft} onSelect={picker.setDraft} {...calendarProps} />
          {clear}
          <Button
            type="button"
            size="lg"
            className={PICKED_CLASS_NAME}
            disabled={picker.draftText === undefined}
            onClick={picker.apply}
          >
            {picker.draftText === undefined
              ? t('datePicker.pickDay')
              : t('datePicker.apply', { date: picker.draftText })}
          </Button>
        </>
      }
      popoverLabel={t('datePicker.calendar')}
      popoverClassName="w-[21.25rem] gap-2.5"
      popover={
        <>
          <Calendar selected={picker.selected} onSelect={picker.pick} {...calendarProps} />
          <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
            {clear ?? <span />}
            <Button
              type="button"
              size="sm"
              className={PICKED_CLASS_NAME}
              onClick={() => picker.popup.changeOpen(false)}
            >
              {t('datePicker.done')}
            </Button>
          </div>
        </>
      }
    />
  );
}
