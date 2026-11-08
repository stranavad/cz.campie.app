import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// Nothing here yet: says why, and what to do next.
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-3xl border border-dashed border-input px-6 py-12 text-center',
        className,
      )}
    >
      {icon === undefined ? null : (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground [&>svg]:size-6">
          {icon}
        </span>
      )}
      <p className="text-heading">{title}</p>
      {description === undefined ? null : <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
