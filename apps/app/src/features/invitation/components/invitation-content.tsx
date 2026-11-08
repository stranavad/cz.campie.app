import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { JoinExisting } from '@/features/invitation/components/join-existing/join-existing';
import { NewAccountForm } from '@/features/invitation/components/new-account-form/new-account-form';
import { useInvitationPage } from '@/features/invitation/components/use-invitation-page.hook';

interface InvitationContentProps {
  token: string;
}

// Who is invited where, and the way in: a password for a new account, a button for an existing one.
export function InvitationContent({ token }: InvitationContentProps) {
  const { t } = useTranslation('invitation');
  const { isInvalid, isLoading, isError, preview } = useInvitationPage(token);

  if (isInvalid) {
    return (
      <Alert variant="danger" role="alert">
        {t('failure.invitation_invalid')}
      </Alert>
    );
  }

  if (isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (isError || preview === undefined) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-[20px] bg-muted p-3">
        <Avatar name={preview.organisation.displayName} className="size-12 bg-card text-base" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[13px] text-muted-foreground">{t('organisation')}</span>
          <span className="font-bold break-words">{preview.organisation.displayName}</span>
        </div>
      </div>
      <p className="text-muted-foreground">{t('forEmail', { email: preview.email })}</p>
      {preview.hasAccount ? (
        <JoinExisting token={token} email={preview.email} />
      ) : (
        <NewAccountForm token={token} email={preview.email} />
      )}
    </>
  );
}
