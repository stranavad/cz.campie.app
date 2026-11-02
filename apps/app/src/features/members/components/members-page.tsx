import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { InvitationList } from '@/features/members/components/invitation-list/invitation-list';
import { InviteForm } from '@/features/members/components/invite-form/invite-form';
import { MemberList } from '@/features/members/components/member-list/member-list';
import { useMembersPage } from '@/features/members/components/use-members-page.hook';

// The Owner's management of the Organisation's admins: their levels, the Owner role, and invitations.
export function MembersPage() {
  const { t } = useTranslation('members');
  const page = useMembersPage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.isNotOwner) {
    return <p className="py-12">{t('notOwner')}</p>;
  }

  if (page.isError) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return (
    <div className="flex flex-col gap-10 py-12">
      <header className="flex flex-col gap-2">
        <Link to="/platform" className="text-sm text-muted-foreground underline">
          {t('backHome')}
        </Link>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('intro')}</p>
      </header>
      <MemberList organisationId={page.organisationId} members={page.members} />
      <InvitationList organisationId={page.organisationId} invitations={page.invitations} />
      <InviteForm organisationId={page.organisationId} />
    </div>
  );
}
