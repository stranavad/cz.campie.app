import { useTranslation } from 'react-i18next';

import { AuditEntryDetails } from '@/core/audit/components/audit-entry-details';
import { AuditTargetName } from '@/core/audit/components/audit-target-name';
import { useAuditEntry, type ShownAuditEntry } from '@/core/audit/hooks/use-audit-entry.hook';

interface AuditEntryViewProps {
  entry: ShownAuditEntry;
}

// One audit entry as a sentence about a named record, who did it, what changed, and its details collapsed.
export function AuditEntryView({ entry }: AuditEntryViewProps) {
  const { t } = useTranslation('audit');
  const shown = useAuditEntry(entry);

  return (
    <div className="flex min-w-0 flex-col gap-1 text-sm">
      <p className="flex flex-wrap gap-x-1.5 leading-snug">
        <span className="font-semibold">{shown.action}</span>
        <AuditTargetName target={shown.target} />
      </p>
      <p className="break-words text-muted-foreground">{shown.actor}</p>
      {shown.changes.length === 0 ? null : (
        <ul className="mt-1 flex flex-col gap-0.5 rounded-2xl bg-muted px-3 py-2 text-[13px]">
          {shown.changes.map(({ field, text }) => (
            <li key={field} className="break-words">
              {text}
            </li>
          ))}
        </ul>
      )}
      {shown.encrypted.length === 0 ? null : (
        <p className="text-[13px] text-muted-foreground">{t('encrypted', { fields: shown.encrypted.join(', ') })}</p>
      )}
      <AuditEntryDetails details={shown.details} />
    </div>
  );
}
