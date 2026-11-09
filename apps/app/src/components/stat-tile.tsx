import { cn } from '@/lib/utils';

interface StatTileProps {
  // "Zaplaceno celé", "Vybráno".
  label: string;
  // The figure, already formatted ("24", "186 400 Kč").
  value: string;
  className?: string;
}

// One figure with its caption, in a row of key numbers (the overview's hero card). Sits on a tinted or
// muted surface, so it has no border of its own.
export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-[20px] bg-card px-4.5 py-4', className)}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="truncate font-display text-[30px] leading-tight font-bold tabular-nums">{value}</span>
    </div>
  );
}
