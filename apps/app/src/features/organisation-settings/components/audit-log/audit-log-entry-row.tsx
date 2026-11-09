import { useTranslation } from 'react-i18next';

import type { AuditEntry } from '@repo/schema/audit';
import { pragueLocalOf } from '@repo/schema/shared';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuditEntryChanges, AuditEntryDetails, AuditTargetName, useAuditEntry } from '@/core/audit';

interface AuditLogEntryRowProps {
  entry: AuditEntry;
}

// One entry as a sentence: when, who did what to which record, its area; the changes open on demand.
export function AuditLogEntryRow({ entry }: AuditLogEntryRowProps) {
  const { t } = useTranslation('organisationSettings');
  const { t: tAudit } = useTranslation('audit');
  const shown = useAuditEntry(entry);
  const time = pragueLocalOf(new Date(entry.occurredAt)).slice(11);

  return (
    <li className="content-auto flex items-start gap-3 border-t border-border-subtle px-4 py-3 first:border-t-0 sm:px-5">
      <time
        dateTime={entry.occurredAt}
        className="w-11 shrink-0 pt-1.5 text-[13px] text-subtle-foreground tabular-nums"
      >
        {time}
      </time>
      <Avatar
        name={entry.actor.name ?? tAudit(`actors.${entry.actor.kind}`)}
        className="hidden size-8 text-xs min-[400px]:flex"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <p className="flex min-w-0 flex-[1_1_14rem] flex-wrap gap-x-1.5 leading-snug">
            <span className="font-semibold">{shown.action}</span>
            <AuditTargetName target={shown.target} />
            <span className="break-words text-muted-foreground">{t('auditLog.by', { actor: shown.actor })}</span>
          </p>
          {shown.area === null ? null : (
            <Badge className="-mt-0.5 h-6.5 px-2.5 text-xs">{tAudit(`areas.${shown.area}`)}</Badge>
          )}
        </div>
        <AuditEntryDetails
          details={shown.details}
          summary={shown.changes.length === 0 ? undefined : t('auditLog.changes', { count: shown.changes.length })}
        >
          <AuditEntryChanges changes={shown.changes} encrypted={shown.encrypted} />
        </AuditEntryDetails>
      </div>
    </li>
  );
}
