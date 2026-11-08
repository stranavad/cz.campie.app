import { useTranslation } from 'react-i18next';

import type { AuditEntry } from '@repo/schema/audit';
import { pragueLocalOf } from '@repo/schema/shared';

import { Avatar } from '@/components/ui/avatar';
import { AuditEntryView } from '@/core/audit';

interface AuditLogEntryRowProps {
  entry: AuditEntry;
}

// One entry: when, who, and what happened to which record.
export function AuditLogEntryRow({ entry }: AuditLogEntryRowProps) {
  const { t } = useTranslation('audit');
  const time = pragueLocalOf(new Date(entry.occurredAt)).slice(11);

  return (
    <li className="content-auto flex gap-3 border-t border-border-subtle px-4 py-3.5 first:border-t-0 sm:gap-4 sm:px-5">
      <time dateTime={entry.occurredAt} className="w-11 shrink-0 pt-1 text-[13px] text-subtle-foreground tabular-nums">
        {time}
      </time>
      <Avatar
        name={entry.actor.name ?? t(`actors.${entry.actor.kind}`)}
        className="hidden size-8 text-xs min-[400px]:flex"
      />
      <div className="min-w-0 flex-1">
        <AuditEntryView entry={entry} />
      </div>
    </li>
  );
}
