import * as React from 'react';

import { cn } from '@/lib/utils';

// A surface: rounded, bordered, no shadow (borders cost nothing to paint, shadows do on long pages).
function Card({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      data-slot="card"
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 text-card-foreground sm:p-6',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-wrap items-start gap-3', className)} {...props} />;
}

function CardTitle({ className, children, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2 data-slot="card-title" className={cn('text-heading min-w-0 flex-1', className)} {...props}>
      {children}
    </h2>
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

// Actions at the bottom of a card.
function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex flex-wrap items-center gap-2', className)} {...props} />;
}

export { Card, CardDescription, CardFooter, CardHeader, CardTitle };
