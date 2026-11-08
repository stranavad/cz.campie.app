import { useTranslation } from 'react-i18next';

import type { useAuditEntry } from '@/core/audit/hooks/use-audit-entry.hook';

interface AuditEntryDetailsProps {
  details: ReturnType<typeof useAuditEntry>['details'];
}

// The technical side of an entry, collapsed: its action key, record id, IP address and unnamed fields.
export function AuditEntryDetails({ details }: AuditEntryDetailsProps) {
  const { t } = useTranslation('audit');

  return (
    <details className="text-[13px] text-subtle-foreground">
      <summary className="w-fit cursor-pointer">{t('details')}</summary>
      <ul className="mt-1 flex flex-col gap-0.5 rounded-2xl bg-muted px-3 py-2">
        {details.map(({ label, text }) => (
          <li key={label} className="break-all">
            {text}
          </li>
        ))}
      </ul>
    </details>
  );
}
