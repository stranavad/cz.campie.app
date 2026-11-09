import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { PICKED_CLASS_NAME } from '@/components/date-picker/date-picker.constant';
import { Button } from '@/components/ui/button';

interface DateTimePopoverProps {
  calendar: ReactNode;
  times: ReactNode;
  // The clear button, when the time is optional.
  clear: ReactNode;
  // The pick as the field would show it, once it has a day.
  picked: string | undefined;
  onCancel: () => void;
  onApply: () => void;
}

// A laptop's date-time popover: the calendar beside the time columns, the pick and its buttons below.
export function DateTimePopover({ calendar, times, clear, picked, onCancel, onApply }: DateTimePopoverProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">{calendar}</div>
        <div aria-hidden="true" className="w-px bg-border-subtle" />
        <div className="flex w-38 shrink-0 flex-col gap-2">
          <h3 className="flex h-10 items-center text-lg font-bold">{t('datePicker.time')}</h3>
          {times}
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
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {t('datePicker.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            className={PICKED_CLASS_NAME}
            disabled={picked === undefined}
            onClick={onApply}
          >
            {t('datePicker.done')}
          </Button>
        </div>
      </div>
    </>
  );
}
