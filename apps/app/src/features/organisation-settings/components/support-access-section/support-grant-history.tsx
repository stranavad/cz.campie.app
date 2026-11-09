import { useTranslation } from 'react-i18next';

import type { SupportGrant } from '@repo/schema/organisations';
import { czechDateTime } from '@repo/schema/shared';

import { personNameWithEmail } from '@/core/account';

interface SupportGrantHistoryProps {
  grants: SupportGrant[];
}

// Every grant so far, newest first as the API lists them.
export function SupportGrantHistory({ grants }: SupportGrantHistoryProps) {
  const { t } = useTranslation('organisationSettings');

  if (grants.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[13px] font-semibold text-muted-foreground">{t('supportAccess.historyTitle')}</h4>
      <ul className="flex flex-col rounded-2xl bg-muted px-4 text-sm">
        {grants.map((grant) => (
          <li key={grant.id} className="border-t border-border py-2.5 tabular-nums first:border-t-0">
            {t('supportAccess.history', {
              from: czechDateTime(grant.grantedAt),
              until: czechDateTime(grant.revokedAt ?? grant.expiresAt),
              kind: t(grant.allowWrites ? 'supportAccess.kindWrites' : 'supportAccess.kindReadOnly'),
            })}
            {grant.grantedBy === null ? null : (
              <span className="block text-[13px] break-words text-muted-foreground">
                {t('supportAccess.grantedBy', { name: personNameWithEmail(grant.grantedBy) })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
