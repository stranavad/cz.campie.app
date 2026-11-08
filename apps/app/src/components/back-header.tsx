import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface BackHeaderProps {
  // The back link, rendered by the caller (a router Link with this class), so it stays typed.
  back: (className: string) => ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  // The title is the screen's main heading (an h1), unless the screen has its own below.
  isHeading?: boolean;
  className?: string;
}

const backClassName =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-control bg-card text-foreground transition-colors hover:bg-muted [&>svg]:size-5';

// The top of a guardian's phone screen: a round back button, the screen's name and its context.
export function BackHeader({ back, title, subtitle, isHeading = false, className }: BackHeaderProps) {
  const Title = isHeading ? 'h1' : 'span';

  return (
    <div className={cn('flex items-center gap-2 py-2.5', className)}>
      {back(backClassName)}
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <Title className="truncate font-sans text-[15px] leading-tight font-bold tracking-normal">{title}</Title>
        {subtitle === undefined ? null : <span className="truncate text-[13px] text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
