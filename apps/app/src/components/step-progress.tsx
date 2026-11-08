import { cn } from '@/lib/utils';

interface StepProgressProps {
  // 1-based.
  current: number;
  total: number;
  // "Krok 2 ze 4 · Rodiče → Děti → ...", already translated.
  label: string;
  className?: string;
}

// Segmented progress through a multi-step form.
export function StepProgress({ current, total, label, className }: StepProgressProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={cn('h-1.5 rounded-full', index < current ? 'bg-brand' : 'bg-muted')} />
        ))}
      </div>
      <p className="text-[13px] text-muted-foreground">{label}</p>
    </div>
  );
}
