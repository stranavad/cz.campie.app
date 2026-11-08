import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// An inline notice inside a page or form: info, a success, something to check, or an error.
const alertVariants = cva(
  'flex min-w-0 gap-3 rounded-2xl px-4 py-3 text-sm leading-snug [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        info: 'bg-muted text-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        danger: 'bg-danger text-danger-foreground',
        brand: 'bg-brand-soft text-foreground',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-content" className={cn('flex min-w-0 flex-1 flex-col gap-1', className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="alert-title" className={cn('font-bold', className)} {...props} />;
}

export { Alert, AlertContent, AlertTitle };
