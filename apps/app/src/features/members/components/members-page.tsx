import { Navigate } from '@tanstack/react-router';
import { UserPlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { InvitationList } from '@/features/members/components/invitation-list/invitation-list';
import { InviteForm } from '@/features/members/components/invite-form/invite-form';
import { MemberList } from '@/features/members/components/member-list/member-list';
import { useMembersPage } from '@/features/members/components/use-members-page.hook';

const INVITE_ANCHOR = 'pozvat';

// The Owner's management of the Organisation's admins: their levels, the Owner role, and invitations.
export function MembersPage() {
  const { t } = useTranslation('members');
  const page = useMembersPage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (page.isNotOwner) {
    return <Alert>{t('notOwner')}</Alert>;
  }

  if (page.isError) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('intro')}
        actions={
          <a href={`#${INVITE_ANCHOR}`} className={buttonVariants()}>
            <UserPlusIcon aria-hidden="true" />
            {t('inviteAction')}
          </a>
        }
      />
      <MemberList organisationId={page.organisationId} members={page.members} />
      <InvitationList organisationId={page.organisationId} invitations={page.invitations} />
      <InviteForm organisationId={page.organisationId} anchorId={INVITE_ANCHOR} />
    </>
  );
}
