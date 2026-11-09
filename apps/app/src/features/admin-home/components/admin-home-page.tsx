import { Link, Navigate } from '@tanstack/react-router';
import { LayoutDashboardIcon, PlusIcon, ShieldCheckIcon, UserRoundXIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { TurnusSwitcher } from '@/core/selected-turnus';
import { OccupancyHero } from '@/features/admin-home/components/occupancy-hero';
import { OrganisationStatusNotice } from '@/features/admin-home/components/organisation-status-notice';
import { TurnusyOccupancy } from '@/features/admin-home/components/turnusy-occupancy';
import { useAdminHome } from '@/features/admin-home/components/use-admin-home.hook';
import { WaitingList } from '@/features/admin-home/components/waiting-list';

// The admin's start of the day: how full the Selected Turnus is, what waits for them, and every Turnus.
export function AdminHomePage() {
  const { t } = useTranslation('adminHome');
  const page = useAdminHome();

  if (page.isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  // The Platform operator usually belongs to no Organisation; the console is their home.
  if (page.hasNoMembership) {
    return (
      <>
        <PageHeader title={t('title')} />
        {page.isOperator ? (
          <EmptyState
            icon={<ShieldCheckIcon />}
            title={t('operator')}
            action={
              <Link to="/platform/konzole" className={buttonVariants()}>
                {t('openConsole')}
              </Link>
            }
          />
        ) : (
          <EmptyState icon={<UserRoundXIcon />} title={t('noMembership')} />
        )}
      </>
    );
  }

  if (page.isError || page.organisation === undefined) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <>
            <TurnusSwitcher />
            {page.canWrite ? (
              <Link to="/platform/prihlasky/nova" className={buttonVariants()}>
                <PlusIcon aria-hidden="true" />
                {t('newRegistration')}
              </Link>
            ) : null}
          </>
        }
      />
      <OrganisationStatusNotice organisation={page.organisation} />
      {page.turnus === undefined ? null : (
        <>
          <OccupancyHero organisationId={page.organisationId} turnus={page.turnus} />
          <WaitingList organisationId={page.organisationId} turnusId={page.turnus.id} canWrite={page.canWrite} />
        </>
      )}
      {page.canReadCamps ? <TurnusyOccupancy organisationId={page.organisationId} /> : null}
      {page.hasNothingToShow ? <EmptyState icon={<LayoutDashboardIcon />} title={t('nothing')} /> : null}
    </>
  );
}
