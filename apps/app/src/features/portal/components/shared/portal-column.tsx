import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PortalColumnProps {
  children: ReactNode;
  className?: string;
}

// The portal's narrow column: a phone screen, centred on wider ones.
export function PortalColumn({ children, className }: PortalColumnProps) {
  return (
    <section className={cn('mx-auto flex w-full max-w-xl flex-col gap-4 pt-2 pb-12', className)}>{children}</section>
  );
}
