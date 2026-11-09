import { DayButton, type DayButtonProps } from 'react-day-picker';

import { PICKED_CLASS_NAME } from '@/components/date-picker/date-picker.constant';
import { cn } from '@/lib/utils';

// A day of the calendar; the picked one takes the picker's action colour.
export function CalendarDayButton({ className, modifiers, ...props }: DayButtonProps) {
  return (
    <DayButton modifiers={modifiers} className={cn(className, modifiers.selected && PICKED_CLASS_NAME)} {...props} />
  );
}
