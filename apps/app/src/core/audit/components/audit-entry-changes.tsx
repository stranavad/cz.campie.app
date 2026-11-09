import { useTranslation } from 'react-i18next';

import type { useAuditEntry } from '@/core/audit/hooks/use-audit-entry.hook';

interface AuditEntryChangesProps {
  changes: ReturnType<typeof useAuditEntry>['changes'];
  encrypted: ReturnType<typeof useAuditEntry>['encrypted'];
}

// What an entry changed: plain fields with old and new values, encrypted ones by name only.
export function AuditEntryChanges({ changes, encrypted }: AuditEntryChangesProps) {
  const { t } = useTranslation('audit');

  return (
    <>
      {changes.length === 0 ? null : (
        <ul className="mt-1 flex flex-col gap-0.5 rounded-2xl bg-muted px-3 py-2 text-[13px]">
          {changes.map(({ field, text }) => (
            <li key={field} className="break-words">
              {text}
            </li>
          ))}
        </ul>
      )}
      {encrypted.length === 0 ? null : (
        <p className="text-[13px] text-muted-foreground">{t('encrypted', { fields: encrypted.join(', ') })}</p>
      )}
    </>
  );
}
