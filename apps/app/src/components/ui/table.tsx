import * as React from 'react';

import { cn } from '@/lib/utils';

// A table in a card that scrolls sideways on its own on a narrow screen, never the page. `footer` (a
// `TableFooter`) sits under the rows, outside the scrolling box.
function Table({
  className,
  containerClassName,
  footer,
  ...props
}: React.ComponentProps<'table'> & { containerClassName?: string; footer?: React.ReactNode }) {
  return (
    <div
      data-slot="table-container"
      className={cn('min-w-0 overflow-hidden rounded-3xl border border-border bg-card', containerClassName)}
    >
      <div className="overflow-x-auto overscroll-x-contain">
        <table data-slot="table" className={cn('w-full border-collapse text-sm', className)} {...props} />
      </div>
      {footer}
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('text-left text-[13px] text-muted-foreground', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-t border-border-subtle transition-colors first:border-t-0 [tbody_&]:hover:bg-muted/50 [thead+tbody_&]:first:border-t',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn('px-3 py-3.5 font-medium whitespace-nowrap first:pl-5 last:pr-5', className)}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td data-slot="table-cell" className={cn('px-3 py-3 align-middle first:pl-5 last:pr-5', className)} {...props} />
  );
}

// A summary line under the rows: "38 účastníků".
function TableFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="table-footer"
      className={cn('border-t border-border-subtle px-5 py-3.5 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow };
