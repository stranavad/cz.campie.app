import { cn } from '@/lib/utils';

// A placeholder while data loads. Static (no shimmer): an animated gradient repaints every frame.
function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" data-slot="skeleton" className={cn('rounded-2xl bg-muted', className)} />;
}

export { Skeleton };
