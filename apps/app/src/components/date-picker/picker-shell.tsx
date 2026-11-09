import type { ComponentProps, ReactNode } from 'react';

import { TRIGGER_CLASS_NAME } from '@/components/date-picker/date-picker.constant';
import { PickerInput } from '@/components/date-picker/picker-input';
import { useNarrowScreen } from '@/components/date-picker/use-narrow-screen.hook';
import type { PickerPopup } from '@/components/date-picker/use-picker-popup.hook';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface PickerShellProps {
  popup: PickerPopup;
  input: Omit<ComponentProps<typeof PickerInput>, 'trigger' | 'inputRef'>;
  // The trigger's icon and its accessible name.
  icon: ReactNode;
  openLabel: string;
  // What a phone's sheet holds under its title.
  sheet: ReactNode;
  // What a laptop's popover holds, its accessible name and width.
  popover: ReactNode;
  popoverLabel: string;
  popoverClassName: string;
}

// A picker's field with the button opening it: a popover on a laptop, a sheet from the bottom on a phone.
export function PickerShell({
  popup,
  input,
  icon,
  openLabel,
  sheet,
  popover,
  popoverLabel,
  popoverClassName,
}: PickerShellProps) {
  const isNarrow = useNarrowScreen();
  const field = (trigger: ReactNode) => <PickerInput inputRef={popup.input} trigger={trigger} {...input} />;

  if (isNarrow) {
    return (
      <Sheet open={popup.isOpen} onOpenChange={popup.changeOpen}>
        {field(
          <SheetTrigger disabled={input.disabled} aria-label={openLabel} className={TRIGGER_CLASS_NAME}>
            {icon}
          </SheetTrigger>,
        )}
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{popup.title}</SheetTitle>
          </SheetHeader>
          {sheet}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={popup.isOpen} onOpenChange={popup.changeOpen}>
      {field(
        <PopoverTrigger disabled={input.disabled} aria-label={openLabel} className={TRIGGER_CLASS_NAME}>
          {icon}
        </PopoverTrigger>,
      )}
      <PopoverContent align="end" aria-label={popoverLabel} className={cn('flex flex-col p-4', popoverClassName)}>
        {popover}
      </PopoverContent>
    </Popover>
  );
}
