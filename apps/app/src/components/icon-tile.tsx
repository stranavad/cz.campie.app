import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface IconTileProps {
  children: ReactNode;
  // `brand` tints the tile with the accent; `success` marks something done.
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

const TONES = {
  neutral: 'bg-muted text-foreground',
  brand: 'bg-brand-soft text-brand-soft-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  danger: 'bg-danger text-danger-foreground',
} as const;

// A rounded square holding an icon, leading a card or a list row.
export function IconTile({ children, tone = 'neutral', className }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-[14px] [&>svg]:size-5.5',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
