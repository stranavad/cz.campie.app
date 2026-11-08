import { Link } from '@tanstack/react-router';

import type { useAuditEntry } from '@/core/audit/hooks/use-audit-entry.hook';

interface AuditTargetNameProps {
  target: ReturnType<typeof useAuditEntry>['target'];
}

// The record an entry is about, by name, linked to its page where it has one.
export function AuditTargetName({ target }: AuditTargetNameProps) {
  if (target.name === null) {
    return null;
  }

  const className = 'underline underline-offset-2 break-words';

  if (target.link?.page === 'registration') {
    return (
      <Link
        to="/platform/prihlasky/$registrationId"
        params={{ registrationId: target.link.registrationId }}
        className={className}
      >
        {target.name}
      </Link>
    );
  }

  if (target.link?.page === 'camp') {
    return (
      <Link to="/platform/tabory" search={{ tabor: target.link.campId }} className={className}>
        {target.name}
      </Link>
    );
  }

  return <span className="break-words">{target.name}</span>;
}
