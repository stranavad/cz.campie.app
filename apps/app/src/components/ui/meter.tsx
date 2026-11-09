import { Meter as MeterPrimitive } from '@base-ui/react/meter';

import { cn } from '@/lib/utils';

interface MeterProps {
  // Names the meter ("1. turnus · 5.-18. 7."), shown above the bar.
  label: string;
  value: number;
  max: number;
  // The figure at the right ("38 / 50", "Plno · 2 náhradníci"), also what a screen reader hears.
  valueLabel: string;
  className?: string;
}

// How full something is (a Turnus's places): a labelled bar with its figure. A meter, not a progressbar, so
// screen readers announce a measurement rather than a task in progress.
function Meter({ label, value, max, valueLabel, className }: MeterProps) {
  return (
    <MeterPrimitive.Root
      value={Math.min(Math.max(value, 0), max)}
      max={max}
      aria-valuetext={valueLabel}
      className={cn('flex flex-col gap-2', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <MeterPrimitive.Label className="min-w-0 truncate font-semibold">{label}</MeterPrimitive.Label>
        <span aria-hidden="true" className="shrink-0 text-muted-foreground tabular-nums">
          {valueLabel}
        </span>
      </div>
      <MeterPrimitive.Track className="h-2 overflow-hidden rounded-full bg-muted">
        <MeterPrimitive.Indicator className="h-full rounded-full bg-brand" />
      </MeterPrimitive.Track>
    </MeterPrimitive.Root>
  );
}

export { Meter };
