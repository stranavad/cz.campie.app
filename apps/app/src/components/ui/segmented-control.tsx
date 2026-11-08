import * as React from 'react';

import { cn } from '@/lib/utils';

// A pill group of mutually exclusive filters or views ("Všechny 38 · Zaplaceno 24 · ..."). Each item is a
// toggle button with aria-pressed, so it works with the keyboard and screen readers without a tab widget.
function SegmentedControl({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="group"
      data-slot="segmented-control"
      className={cn('scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1', className)}
      {...props}
    />
  );
}

function SegmentedControlItem({
  className,
  selected,
  ...props
}: Omit<React.ComponentProps<'button'>, 'aria-pressed'> & { selected: boolean }) {
  return (
    <button
      type="button"
      data-slot="segmented-control-item"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap text-nav-foreground sm:h-9 transition-colors duration-150 hover:text-foreground aria-pressed:bg-card aria-pressed:font-semibold aria-pressed:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

// The count beside an item's label.
function SegmentedControlCount({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('text-subtle-foreground tabular-nums', className)} {...props} />;
}

export { SegmentedControl, SegmentedControlCount, SegmentedControlItem };
