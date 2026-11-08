import * as React from 'react';

import { cn } from '@/lib/utils';

// Label and value pairs in a grid: two columns from a small width up, one on the narrowest phones.
function DescriptionList({ className, ...props }: React.ComponentProps<'dl'>) {
  return (
    <dl
      data-slot="description-list"
      className={cn('grid grid-cols-1 gap-x-4 gap-y-3 text-sm min-[400px]:grid-cols-2', className)}
      {...props}
    />
  );
}

function DescriptionItem({
  label,
  className,
  children,
}: {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
  );
}

export { DescriptionItem, DescriptionList };
