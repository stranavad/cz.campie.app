import { Link, Navigate } from '@tanstack/react-router';
import { PlusIcon, UserRoundXIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { TurnusSwitcher } from '@/core/selected-turnus';
import { OrganisationStatusNotice } from '@/features/admin-home/components/organisation-status-notice';
import { QuickLinks } from '@/features/admin-home/components/quick-links';
import { useAdminHome } from '@/features/admin-home/components/use-admin-home.hook';

export function AdminHomePage() {
  const { t } = useTranslation('adminHome');
  const { isLoading, isSignedOut, isError, hasNoMembership, organisation, canCreateRegistration, links, isOperator } =
    useAdminHome();

  if (isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  // The Platform operator usually belongs to no Organisation; the console is their home.
  if (hasNoMembership) {
    return (
      <>
        <PageHeader title={t('title')} />
        {isOperator ? null : <EmptyState icon={<UserRoundXIcon />} title={t('noMembership')} />}
        <QuickLinks links={links} />
      </>
    );
  }

  if (isError || organisation === undefined) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        description={organisation.displayName}
        actions={
          <>
            <TurnusSwitcher />
            {canCreateRegistration ? (
              <Link to="/platform/prihlasky/nova" className={buttonVariants()}>
                <PlusIcon aria-hidden="true" />
                {t('newRegistration')}
              </Link>
            ) : null}
          </>
        }
      />
      <OrganisationStatusNotice organisation={organisation} />
      <QuickLinks links={links} />
    </>
  );
}
