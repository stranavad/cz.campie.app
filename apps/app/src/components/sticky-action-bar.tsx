import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface StickyActionBarProps {
  children: ReactNode;
  className?: string;
}

// The bar pinned to the bottom of a long phone form: a summary (the price) and the next step. Sticky, not
// fixed, so it never covers the page's last field and needs no scroll listener. Clears the iOS home bar.
export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-4 flex items-center gap-3 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:rounded-3xl sm:border sm:pb-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
