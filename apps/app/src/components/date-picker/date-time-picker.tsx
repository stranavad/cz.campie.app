import { useTranslation } from 'react-i18next';

import { DatePicker } from '@/components/date-picker/date-picker';
import { QUARTER_HOURS } from '@/components/date-picker/date-picker.helper';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  // The Prague wall-clock time as `YYYY-MM-DDTHH:mm`; empty when none is picked.
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  clearable?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

// Midnight, until a time is picked.
const DEFAULT_TIME = '00:00';

// A day from our calendar and a time in quarter hours. The time waits for a day, so the value is either
// empty or whole.
export function DateTimePicker({
  value,
  onChange,
  onBlur,
  clearable,
  id,
  disabled,
  className,
  ...aria
}: DateTimePickerProps) {
  const { t } = useTranslation();
  const [date = '', time = ''] = value.split('T');
  const hhmm = time.slice(0, 5);
  // A time saved off the quarter-hour grid stays selectable instead of silently changing.
  const times = hhmm === '' || QUARTER_HOURS.includes(hhmm) ? QUARTER_HOURS : [...QUARTER_HOURS, hhmm].sort();

  return (
    <div className={cn('flex min-w-0 gap-2', className)}>
      <DatePicker
        id={id}
        value={date}
        clearable={clearable}
        disabled={disabled}
        onBlur={onBlur}
        className="flex-1"
        onChange={(next) => onChange(next === '' ? '' : `${next}T${hhmm === '' ? DEFAULT_TIME : hhmm}`)}
        {...aria}
      />
      <Select
        aria-label={t('datePicker.time')}
        className="w-28 shrink-0 tabular-nums"
        disabled={disabled === true || date === ''}
        value={hhmm === '' ? null : hhmm}
        placeholder={t('datePicker.timePlaceholder')}
        onValueChange={(next) => onChange(`${date}T${next}`)}
        options={times.map((option) => ({ value: option, label: option }))}
      />
    </div>
  );
}
