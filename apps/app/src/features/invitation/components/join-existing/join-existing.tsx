import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

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
      <div className="flex flex-col items-start gap-4">
        <output className="block">{t('existingAccount.done')}</output>
        {isSignedIn ? (
          <Link to="/platform" className={buttonVariants()}>
            {t('existingAccount.continue')}
          </Link>
        ) : (
          <Link to="/platform/prihlaseni" className={buttonVariants()}>
            {t('existingAccount.logIn')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">{t('existingAccount.intro')}</p>
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`failure.${failure}`)}
        </p>
      )}
      <Button disabled={isPending} onClick={join}>
        {t('accept')}
      </Button>
    </div>
  );
}
