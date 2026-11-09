import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type CountPillProps = Omit<ComponentProps<'span'>, 'children'> & {
  count: number;
  // Muted for a plain count, warning for what waits on someone.
  tone?: 'muted' | 'warning';
};

// A small count in a navigation pill or tab, such as the Registrations beside their link.
export function CountPill({ count, tone = 'muted', className, ...props }: CountPillProps) {
  return (
    <span
      className={cn(
        'flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.75 text-xs font-bold tabular-nums',
        tone === 'muted' ? 'bg-muted text-foreground' : 'bg-warning text-warning-foreground',
        className,
      )}
      {...props}
    >
      {count}
    </span>
  );
}
