import { Link } from '@tanstack/react-router';
import { ChevronRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ParticipantRow } from '@repo/schema/registrations';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from '@/core/participant-list';
import { DueLine } from '@/features/participants/components/participant-list/due-line';
import { InvoiceCell } from '@/features/participants/components/participant-list/invoice-cell';
import { ParticipantIssues } from '@/features/participants/components/participant-list/participant-issues';
import { cn } from '@/lib/utils';

interface ParticipantCardProps {
  row: ParticipantRow;
}

// One child on a phone: name, age and guardian, then the payment and whatever is missing.
export function ParticipantCard({ row }: ParticipantCardProps) {
  const { t } = useTranslation('participants');
  const name = t('name', { first: row.firstName, last: row.lastName });
  const isCancelled = row.status === 'cancelled';

  return (
    <li className="content-auto">
      <Link
        to="/platform/prihlasky/$registrationId"
        params={{ registrationId: row.registrationId }}
        className="flex items-start gap-3 px-4 py-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted"
      >
        <Avatar name={name} className="mt-0.5" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate font-semibold', isCancelled && 'text-muted-foreground line-through')}>
              {name}
            </span>
            <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">{row.variableSymbol}</span>
          </span>
          <span className="truncate text-[13px] text-muted-foreground">
            {t('row.summary', { age: t('age', { count: row.ageOnStart }), guardian: row.guardianName })}
          </span>
          <span className="-mt-1.5 truncate text-[13px] text-muted-foreground">{row.guardianEmail}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            {isCancelled ? <Badge>{t('cancelled')}</Badge> : null}
            <PaymentStatusBadge status={row.paymentStatus} />
            <DueLine amount={row.amountDue.amount} overdue={row.overdue} />
            {row.invoice === null ? null : <InvoiceCell invoice={row.invoice} />}
          </span>
          <ParticipantIssues row={row} />
        </span>
        <ChevronRightIcon aria-hidden="true" className="mt-2.5 size-4 shrink-0 text-subtle-foreground" />
      </Link>
    </li>
  );
}
