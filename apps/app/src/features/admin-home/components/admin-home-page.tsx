import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import { OrganisationStatusNotice } from '@/features/admin-home/components/organisation-status-notice';
import { useAdminHome } from '@/features/admin-home/components/use-admin-home.hook';

export function AdminHomePage() {
  const { t } = useTranslation('adminHome');
  const { isLoading, isSignedOut, isError, hasNoMembership, organisation, isOwner } = useAdminHome();

  if (isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (hasNoMembership) {
    return <p className="py-12">{t('noMembership')}</p>;
  }

  if (isError || organisation === undefined) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <OrganisationStatusNotice organisation={organisation} />
      {isOwner ? (
        <Link to="/platform/uzivatele" className={buttonVariants({ variant: 'outline' })}>
          {t('manageUsers')}
        </Link>
      ) : null}
    </div>
  );
}
