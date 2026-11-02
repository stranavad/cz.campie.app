import { useTranslation } from 'react-i18next';

import type { Invitation } from '@repo/schema/admins';

import { Button } from '@/components/ui/button';
import { useInvitationList } from '@/features/members/components/invitation-list/use-invitation-list.hook';

interface InvitationListProps {
  organisationId: string;
  invitations: Invitation[];
}

export function InvitationList({ organisationId, invitations }: InvitationListProps) {
  const { t } = useTranslation('members');
  const { rows, isRevoking, hasFailed, revoke } = useInvitationList(organisationId, invitations);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{t('invitations.title')}</h2>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t('invitations.empty')}</p> : null}
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border py-3">
            <span className="font-medium">{row.email}</span>
            <span className="text-sm text-muted-foreground">{row.permissions}</span>
            <span className="text-sm text-muted-foreground">{row.validity}</span>
            <Button variant="ghost" size="sm" className="ml-auto" disabled={isRevoking} onClick={() => revoke(row.id)}>
              {t('invitations.revoke')}
            </Button>
          </li>
        ))}
      </ul>
      {hasFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('invitations.failure')}
        </p>
      ) : null}
    </section>
  );
}
