import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { LoginRedirect } from '@/core/account';
import { InvitationList } from '@/features/members/components/invitation-list/invitation-list';
import { InviteDialog } from '@/features/members/components/invite-form/invite-dialog';
import { MemberTable } from '@/features/members/components/member-table/member-table';
import { useMembersPage } from '@/features/members/components/use-members-page.hook';

// The Owner's management of the Organisation's admins: their levels, the Owner role, and invitations.
export function MembersPage() {
  const { t } = useTranslation('members');
  const page = useMembersPage();

  if (page.isSignedOut) {
    return <LoginRedirect />;
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
        actions={<InviteDialog organisationId={page.organisationId} />}
      />
      <MemberTable organisationId={page.organisationId} members={page.members} />
      <InvitationList organisationId={page.organisationId} invitations={page.invitations} />
    </>
  );
}
