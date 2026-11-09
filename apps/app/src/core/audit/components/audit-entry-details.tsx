import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { useAuditEntry } from '@/core/audit/hooks/use-audit-entry.hook';

interface AuditEntryDetailsProps {
  details: ReturnType<typeof useAuditEntry>['details'];
  // The toggle's text; "Podrobnosti" unless given.
  summary?: string;
  // Shown above the technical lines once opened, such as the entry's changes.
  children?: ReactNode;
}

// The technical side of an entry, collapsed: its action key, record id, IP address and unnamed fields.
export function AuditEntryDetails({ details, summary, children }: AuditEntryDetailsProps) {
  const { t } = useTranslation('audit');

  return (
    <details className="text-[13px] text-subtle-foreground">
      <summary className="w-fit cursor-pointer py-1 transition-colors hover:text-foreground">
        {summary ?? t('details')}
      </summary>
      {children === undefined ? null : <div className="flex flex-col gap-1 text-foreground">{children}</div>}
      <ul className="mt-1 flex flex-col gap-0.5 rounded-2xl bg-muted px-3 py-2 text-subtle-foreground">
        {details.map(({ label, text }) => (
          <li key={label} className="break-all">
            {text}
          </li>
        ))}
      </ul>
    </details>
  );
}
