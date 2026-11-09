import { AuditEntryChanges } from '@/core/audit/components/audit-entry-changes';
import { AuditEntryDetails } from '@/core/audit/components/audit-entry-details';
import { AuditTargetName } from '@/core/audit/components/audit-target-name';
import { useAuditEntry, type ShownAuditEntry } from '@/core/audit/hooks/use-audit-entry.hook';

interface AuditEntryViewProps {
  entry: ShownAuditEntry;
}

// One audit entry as a sentence about a named record, who did it, what changed, and its details collapsed.
export function AuditEntryView({ entry }: AuditEntryViewProps) {
  const shown = useAuditEntry(entry);

  return (
    <div className="flex min-w-0 flex-col gap-1 text-sm">
      <p className="flex flex-wrap gap-x-1.5 leading-snug">
        <span className="font-semibold">{shown.action}</span>
        <AuditTargetName target={shown.target} />
      </p>
      <p className="break-words text-muted-foreground">{shown.actor}</p>
      <AuditEntryChanges changes={shown.changes} encrypted={shown.encrypted} />
      <AuditEntryDetails details={shown.details} />
    </div>
  );
}
