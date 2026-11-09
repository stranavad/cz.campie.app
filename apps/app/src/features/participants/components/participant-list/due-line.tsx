import { useTranslation } from 'react-i18next';

import { czk } from '@repo/schema/shared';

import { cn } from '@/lib/utils';

interface DueLineProps {
  amount: number;
  overdue: boolean;
}

// What is due now, red once past its date; nothing when nothing is due.
export function DueLine({ amount, overdue }: DueLineProps) {
  const { t } = useTranslation('participants');

  if (amount === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        'text-[13px] tabular-nums',
        overdue ? 'font-semibold text-danger-foreground' : 'text-muted-foreground',
      )}
    >
      {t(overdue ? 'row.overdue' : 'row.due', { amount: czk(amount) })}
    </span>
  );
}
