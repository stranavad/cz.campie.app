import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { OrganisationStatusNotice } from '@/features/admin-home/components/organisation-status-notice';
import { useAdminHome } from '@/features/admin-home/components/use-admin-home.hook';

export function AdminHomePage() {
  const { t } = useTranslation('adminHome');
  const { isLoading, isSignedOut, isError, organisation } = useAdminHome();

  if (isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (isError || organisation === undefined) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return <OrganisationStatusNotice organisation={organisation} />;
}
