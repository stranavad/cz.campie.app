import { useTranslation } from 'react-i18next';

import type { Invitation } from '@repo/schema/admins';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useInvitationList } from '@/features/members/components/invitation-list/use-invitation-list.hook';

interface InvitationListProps {
  organisationId: string;
  invitations: Invitation[];
}

// Invitations not yet accepted: to whom, until when, which levels; sent again or revoked.
export function InvitationList({ organisationId, invitations }: InvitationListProps) {
  const { t } = useTranslation('members');
  const list = useInvitationList(organisationId, invitations);

  if (list.rows.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <ul className="overflow-hidden rounded-3xl border border-border bg-card">
        {list.rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-subtle px-5 py-4 first:border-t-0 sm:px-6 sm:py-5"
          >
            <span className="flex min-w-0 flex-[1_1_18rem] flex-col leading-snug">
              <span className="font-semibold break-words">{t('invitations.pending', { email: row.email })}</span>
              <span className="text-[13px] text-muted-foreground">
                {t('invitations.meta', { validity: row.validity, permissions: row.permissions })}
              </span>
              <span className="text-[13px] break-words text-muted-foreground">{row.sent}</span>
            </span>
            <Button variant="outline" size="sm" disabled={list.isBusy} onClick={() => list.resend(row.id)}>
              {t('invitations.resend')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-foreground"
              disabled={list.isBusy}
              onClick={() => list.revoke(row.id)}
            >
              {t('invitations.revoke')}
            </Button>
          </li>
        ))}
      </ul>
      {list.resentTo === null ? null : (
        <output className="block">
          <Alert variant="success">{t('invitations.resent', { email: list.resentTo })}</Alert>
        </output>
      )}
      {list.failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`invitations.failure.${list.failure}`)}
        </Alert>
      )}
    </section>
  );
}
