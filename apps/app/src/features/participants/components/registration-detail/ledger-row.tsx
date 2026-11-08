import { cn } from '@/lib/utils';

interface LedgerRowProps {
  label: string;
  value: string;
  // A sum closing a group: bold, with a line above.
  isTotal?: boolean;
  className?: string;
}

// One line of the price or the payments: what and how much.
export function LedgerRow({ label, value, isTotal = false, className }: LedgerRowProps) {
  return (
    <div
      className={cn('flex justify-between gap-3 py-2', isTotal && 'border-t border-border-subtle font-bold', className)}
    >
      <dt className="min-w-0">{label}</dt>
      <dd className="text-right whitespace-nowrap tabular-nums">{value}</dd>
    </div>
  );
}
