import { Input as InputPrimitive } from '@base-ui/react/input';
import * as React from 'react';

import { cn } from '@/lib/utils';

// 16px text on phones keeps iOS from zooming in on focus; 48px tall is a comfortable thumb target.
const controlClassName =
  'w-full min-w-0 rounded-2xl border border-input bg-input-background px-4 text-base text-foreground transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-2 aria-invalid:border-danger-foreground aria-invalid:px-[15px]';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(controlClassName, 'h-12 sm:h-11', className)}
      {...props}
    />
  );
}

export { controlClassName, Input };
