interface PaymentRowProps {
  label: string;
  value: string;
  strong?: boolean;
}

// A label and an amount on one line of a payment summary.
export function PaymentRow({ label, value, strong = false }: PaymentRowProps) {
  return (
    <div className={strong ? 'flex justify-between gap-3 font-bold' : 'flex justify-between gap-3'}>
      <span className={strong ? undefined : 'text-muted-foreground'}>{label}</span>
      <span className="min-w-0 text-right font-semibold wrap-anywhere tabular-nums">{value}</span>
    </div>
  );
}
