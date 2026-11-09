import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { useJoinExisting } from '@/features/invitation/components/join-existing/use-join-existing.hook';

interface JoinExistingProps {
  token: string;
  email: string;
}

// The invitee with an account joins as they are and then signs in with their own password.
export function JoinExisting({ token, email }: JoinExistingProps) {
  const { t } = useTranslation('invitation');
  const { isDone, isSignedIn, isPending, failure, join } = useJoinExisting(token, email);

  if (isDone) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success" className="font-semibold">
          <output className="block">{t('existingAccount.done')}</output>
        </Alert>
        {isSignedIn ? (
          <Link to="/platform" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
            {t('existingAccount.continue')}
          </Link>
        ) : (
          <Link to="/platform/prihlaseni" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
            {t('existingAccount.logIn')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('existingAccount.intro')}</p>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`failure.${failure}`)}
        </Alert>
      )}
      <Button size="lg" disabled={isPending} onClick={join} className="w-full">
        {t('accept')}
      </Button>
    </div>
  );
}
