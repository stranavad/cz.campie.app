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

  const title = <h1 className="text-card-title">{t('title')}</h1>;

  if (isInvalid) {
    return (
      <>
        {title}
        <Alert variant="danger" role="alert">
          {t('failure.invitation_invalid')}
        </Alert>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        {title}
        <p className="text-muted-foreground">{t('loading')}</p>
      </>
    );
  }

  if (isError || preview === undefined) {
    return (
      <>
        {title}
        <Alert variant="danger">{t('error')}</Alert>
      </>
    );
  }

  return (
    <>
      <Avatar name={preview.organisation.displayName} className="size-13 bg-campie-soft text-base" />
      <header className="flex flex-col gap-2">
        <h1 className="text-card-title break-words">
          {t('titleFor', { organisation: preview.organisation.displayName })}
        </h1>
        <p className="text-muted-foreground">{t('forEmail', { email: preview.email })}</p>
      </header>
      {preview.hasAccount ? (
        <JoinExisting token={token} email={preview.email} />
      ) : (
        <NewAccountForm token={token} email={preview.email} />
      )}
    </>
  );
}
