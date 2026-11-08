import * as React from 'react';

import { cn } from '@/lib/utils';

// Horizontal pill navigation between sibling pages or sections (camp settings tabs). Scrolls sideways on a
// phone. Mark the current item with aria-current="page" (a router Link sets data-status="active").
function TabNav({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      data-slot="tab-nav"
      className={cn('scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0', className)}
      {...props}
    />
  );
}

const tabNavItemClassName =
  'inline-flex h-11 shrink-0 items-center rounded-full px-4 font-medium whitespace-nowrap text-nav-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-bold aria-[current=page]:text-foreground data-[status=active]:bg-muted data-[status=active]:font-bold data-[status=active]:text-foreground';

export { TabNav, tabNavItemClassName };
