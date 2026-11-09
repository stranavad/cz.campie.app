import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useTranslation } from 'react-i18next';

import {
  HOURS,
  PICKED_CLASS_NAME,
  QUARTERS,
  TIME_OPTION_CLASS_NAME,
} from '@/components/date-picker/date-picker.constant';
import { cn } from '@/lib/utils';

interface TimeColumnsProps {
  // `HH:mm`.
  time: string;
  onChange: (time: string) => void;
  // A shorter hour column, under the calendar in a phone's sheet.
  compact?: boolean;
}

// The hour from a scrolling column and the minutes in quarter hours, each a radio group: arrow keys move
// within it and screen readers hear "8, 9 of 24" (Base UI).
export function TimeColumns({ time, onChange, compact = false }: TimeColumnsProps) {
  const { t } = useTranslation();
  const [hour = '00', minute = '00'] = time.split(':');
  // A time saved off the quarter-hour grid stays selectable instead of silently changing.
  const minutes = QUARTERS.includes(minute) ? QUARTERS : [...QUARTERS, minute].sort();
  const option = (checked: boolean) => cn(TIME_OPTION_CLASS_NAME, checked && PICKED_CLASS_NAME);

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <RadioGroup
        aria-label={t('datePicker.hour')}
        value={hour}
        onValueChange={(next: string) => onChange(`${next}:${minute}`)}
        className={cn(
          'relative flex flex-col gap-0.5 overflow-y-auto overscroll-contain pr-0.5',
          compact ? 'h-44' : 'h-63',
        )}
        // Brings the picked hour into the middle of the column when it appears.
        ref={(group) => {
          const picked = group?.querySelector<HTMLElement>('[data-checked]');

          if (group && picked) {
            group.scrollTop = picked.offsetTop - (group.clientHeight - picked.offsetHeight) / 2;
          }
        }}
      >
        {HOURS.map((value) => (
          <Radio.Root key={value} value={value} className={option(value === hour)}>
            {Number(value)}
          </Radio.Root>
        ))}
      </RadioGroup>
      <RadioGroup
        aria-label={t('datePicker.minutes')}
        value={minute}
        onValueChange={(next: string) => onChange(`${hour}:${next}`)}
        className="flex flex-col gap-0.5"
      >
        {minutes.map((value) => (
          <Radio.Root key={value} value={value} className={option(value === minute)}>
            {t('datePicker.minuteOption', { minute: value })}
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  );
}
