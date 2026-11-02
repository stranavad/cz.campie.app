import { useTranslation } from 'react-i18next';

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
    return <p role="alert">{t('failure.invitation_invalid')}</p>;
  }

  if (isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (isError || preview === undefined) {
    return <p className="text-destructive">{t('error')}</p>;
  }

  return (
    <>
      <p>{t('intro', { organisation: preview.organisation.displayName, email: preview.email })}</p>
      {preview.hasAccount ? (
        <JoinExisting token={token} email={preview.email} />
      ) : (
        <NewAccountForm token={token} email={preview.email} />
      )}
    </>
  );
}
