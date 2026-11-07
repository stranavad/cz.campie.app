import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import { OrganisationStatusNotice } from '@/features/admin-home/components/organisation-status-notice';
import { useAdminHome } from '@/features/admin-home/components/use-admin-home.hook';

export function AdminHomePage() {
  const { t } = useTranslation('adminHome');
  const {
    isLoading,
    isSignedOut,
    isError,
    hasNoMembership,
    organisation,
    isOwner,
    canSeeCamps,
    canSeeRegistrations,
    isOperator,
  } = useAdminHome();
  const consoleLink = isOperator ? (
    <Link to="/platform/konzole" className={buttonVariants({ variant: 'outline' })}>
      {t('openConsole')}
    </Link>
  ) : null;

  if (isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  // The Platform operator usually belongs to no Organisation; the console is their home.
  if (hasNoMembership) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        {isOperator ? null : <p>{t('noMembership')}</p>}
        {consoleLink}
      </div>
    );
  }

  if (isError || organisation === undefined) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <OrganisationStatusNotice organisation={organisation} />
      {canSeeRegistrations ? (
        <Link to="/platform/prihlasky" className={buttonVariants({ variant: 'outline' })}>
          {t('registrations')}
        </Link>
      ) : null}
      {canSeeCamps ? (
        <Link to="/platform/tabory" className={buttonVariants({ variant: 'outline' })}>
          {t('campSettings')}
        </Link>
      ) : null}
      {isOwner ? (
        <div className="flex flex-wrap gap-2">
          <Link to="/platform/uzivatele" className={buttonVariants({ variant: 'outline' })}>
            {t('manageUsers')}
          </Link>
          <Link to="/platform/nastaveni" className={buttonVariants({ variant: 'outline' })}>
            {t('organisationSettings')}
          </Link>
        </div>
      ) : null}
      {consoleLink}
    </div>
  );
}
