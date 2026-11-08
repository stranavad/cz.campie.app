import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: ReactNode;
  // A line under the title.
  description?: ReactNode;
  // Above the title: a back link or a switcher ("Tábory · přepnout tábor").
  eyebrow?: ReactNode;
  // Beside the title on wide screens, wrapping below it on a phone.
  actions?: ReactNode;
  // Next to the title: a status badge.
  status?: ReactNode;
  className?: string;
}

// The top of an admin or platform page: the display-face title, its status and the page's actions.
export function PageHeader({ title, description, eyebrow, actions, status, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end gap-x-3 gap-y-4', className)}>
      <div className="flex min-w-0 flex-[1_1_18rem] flex-col gap-1">
        {eyebrow}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-title min-w-0">{title}</h1>
          {status}
        </div>
        {description === undefined ? null : <p className="max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions === undefined ? null : <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
