import { cn } from '@/lib/utils';

interface ProgressProps {
  // 0 to 1.
  value: number;
  label: string;
  className?: string;
}

// A thin bar; scaled with a transform, so a change composites instead of re-laying out.
function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className="h-full origin-left rounded-full bg-brand transition-transform duration-300"
        style={{ transform: `scaleX(${clamped})` }}
      />
    </div>
  );
}

export { Progress };
