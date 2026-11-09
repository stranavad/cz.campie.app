import { Clock3Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Calendar } from '@/components/date-picker/calendar';
import { PICKED_CLASS_NAME } from '@/components/date-picker/date-picker.constant';
import { DateTimePopover } from '@/components/date-picker/date-time-popover';
import { PickerClearButton } from '@/components/date-picker/picker-clear-button';
import { PickerShell } from '@/components/date-picker/picker-shell';
import { TimeColumns } from '@/components/date-picker/time-columns';
import { useDateTimePicker } from '@/components/date-picker/use-date-time-picker.hook';
import { Button } from '@/components/ui/button';

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

// One field for a day and a time, typed ("5. 7. 2027 8:30") or picked in one popover: the calendar beside
// an hour column and quarter hours. The pick waits there until "Hotovo", so the value is empty or whole.
export function DateTimePicker({
  value,
  onChange,
  onBlur,
  clearable = false,
  'aria-invalid': ariaInvalid,
  ...input
}: DateTimePickerProps) {
  const { t } = useTranslation();
  const picker = useDateTimePicker({ value, onChange, onBlur });
  const clear = clearable ? <PickerClearButton disabled={value === ''} onClick={picker.clear} /> : null;
  const calendar = <Calendar selected={picker.draft.date} onSelect={picker.pickDate} />;
  const times = (compact: boolean) => (
    <TimeColumns time={picker.draft.time} compact={compact} onChange={picker.pickTime} />
  );

  return (
    <PickerShell
      popup={picker.popup}
      input={{
        ...input,
        text: picker.text,
        placeholder: t('datePicker.dateTimePlaceholder'),
        onCommit: picker.commit,
        onBlur,
        'aria-invalid': ariaInvalid === true || picker.isNoTime,
      }}
      icon={<Clock3Icon aria-hidden="true" />}
      openLabel={t('datePicker.openWithTime')}
      sheet={
        <>
          {calendar}
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
            <h3 className="text-lg font-bold">{t('datePicker.time')}</h3>
            {times(true)}
          </div>
          {clear}
          <Button
            type="button"
            size="lg"
            className={PICKED_CLASS_NAME}
            disabled={picker.picked === undefined}
            onClick={picker.apply}
          >
            {picker.picked === undefined ? t('datePicker.pickDay') : t('datePicker.apply', { date: picker.picked })}
          </Button>
        </>
      }
      popoverLabel={t('datePicker.calendarWithTime')}
      popoverClassName="w-[35rem] gap-3"
      popover={
        <DateTimePopover
          calendar={calendar}
          times={times(false)}
          clear={clear}
          picked={picker.picked}
          onCancel={() => picker.popup.changeOpen(false)}
          onApply={picker.apply}
        />
      }
    />
  );
}
