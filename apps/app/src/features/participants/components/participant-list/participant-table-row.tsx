import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { ParticipantRow } from '@repo/schema/registrations';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { DueLine } from '@/features/participants/components/participant-list/due-line';
import { PaymentStatusBadge } from '@/features/participants/components/payment-status-badge';
import { cn } from '@/lib/utils';

interface ParticipantTableRowProps {
  row: ParticipantRow;
}

// One child in the table: who (and whether answers are owed), the guardian, money, Consents and documents.
export function ParticipantTableRow({ row }: ParticipantTableRowProps) {
  const { t } = useTranslation('participants');
  const name = t('name', { first: row.firstName, last: row.lastName });
  const isCancelled = row.status === 'cancelled';

  return (
    <TableRow className="content-auto">
      <TableCell>
        <Link
          to="/platform/prihlasky/$registrationId"
          params={{ registrationId: row.registrationId }}
          className="flex min-h-11 items-center gap-3 rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Avatar name={name} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className={cn('text-[15px] font-semibold', isCancelled && 'text-muted-foreground line-through')}>
              {name}
            </span>
            <span className="text-[13px] text-muted-foreground">
              {isCancelled
                ? t('row.ageCancelled', { age: t('age', { count: row.ageOnStart }) })
                : t('age', { count: row.ageOnStart })}
            </span>
            {row.missingAnswers ? (
              <span className="text-[13px] font-medium text-warning-foreground">{t('filters.missingAnswers')}</span>
            ) : null}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <span className="flex flex-col leading-tight">
          <span>{row.guardianName}</span>
          <span className="text-[13px] text-muted-foreground">{row.guardianEmail}</span>
          {row.emailUndeliverable ? (
            <Badge variant="danger" className="mt-1 self-start">
              {t('emailUndeliverable')}
            </Badge>
          ) : null}
        </span>
      </TableCell>
      <TableCell>
        <span className="flex flex-col items-start gap-1">
          <PaymentStatusBadge status={row.paymentStatus} />
          <DueLine amount={row.amountDue.amount} overdue={row.overdue} />
          {row.unverifiedClaimedDiscount ? <Badge variant="warning">{t('filters.unverified')}</Badge> : null}
        </span>
      </TableCell>
      <TableCell className={row.unsignedConsent ? 'font-medium text-danger-foreground' : 'text-muted-foreground'}>
        {row.unsignedConsent ? t('row.consentMissing') : t('row.fine')}
      </TableCell>
      <TableCell>
        {row.missingDocument ? (
          <Badge variant="danger">{t('row.documentMissing')}</Badge>
        ) : (
          <Badge>{t('row.fine')}</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
