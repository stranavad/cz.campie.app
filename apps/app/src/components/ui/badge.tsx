import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// A status pill. `dot` adds the leading dot the design uses for payment and window states.
const badgeVariants = cva(
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-nav-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        danger: 'bg-danger text-danger-foreground',
        brand: 'bg-brand-soft text-foreground',
        outline: 'border border-control text-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

function Badge({
  className,
  variant,
  dot = false,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="size-[7px] rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
