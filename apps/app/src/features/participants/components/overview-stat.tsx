import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface OverviewStatProps {
  label: string;
  value: string;
  // Under the value, such as a bar of places taken.
  children?: ReactNode;
  // On the value, such as a warning colour.
  className?: string;
}

// One number of the Turnus overview with its label.
export function OverviewStat({ label, value, children, className }: OverviewStatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-1">
        <span className={cn('font-display text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl', className)}>
          {value}
        </span>
        {children}
      </dd>
    </div>
  );
}
