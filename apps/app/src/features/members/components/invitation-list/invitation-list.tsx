import { MailIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Invitation } from '@repo/schema/admins';

import { IconTile } from '@/components/icon-tile';
import { Alert } from '@/components/ui/alert';
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
    <section className="flex flex-col gap-3">
      <h2 className="text-heading px-1">{t('invitations.title')}</h2>
      {rows.length === 0 ? <p className="px-1 text-sm text-muted-foreground">{t('invitations.empty')}</p> : null}
      {rows.length === 0 ? null : (
        <ul className="overflow-hidden rounded-3xl border border-border bg-card">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle px-5 py-4 first:border-t-0 sm:px-6"
            >
              <IconTile>
                <MailIcon />
              </IconTile>
              <span className="flex min-w-0 flex-[1_1_14rem] flex-col leading-snug">
                <span className="font-semibold break-words">{row.email}</span>
                <span className="text-[13px] text-muted-foreground">{row.validity}</span>
                <span className="text-[13px] text-muted-foreground">{row.permissions}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-foreground"
                disabled={isRevoking}
                onClick={() => revoke(row.id)}
              >
                {t('invitations.revoke')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {hasFailed ? (
        <Alert variant="danger" role="alert">
          {t('invitations.failure')}
        </Alert>
      ) : null}
    </section>
  );
}
