import { Navigate } from '@tanstack/react-router';
import { InboxIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { useGuardianRegistrationsQuery } from '@/features/portal/api/portal.queries';
import { RegistrationCard } from '@/features/portal/components/home/registration-card';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { HttpError } from '@/lib/api';

// The signed-in guardian's Registrations in the subdomain's Organisation, past ones included. Signing out
// sits in the shell's header.
export function PortalPage() {
  const { t } = useTranslation('portal');
  const portal = useGuardianRegistrationsQuery();

  if (portal.error instanceof HttpError && portal.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (portal.isPending) {
    return null;
  }

  return (
    <PortalColumn className="gap-6">
      <h1 className="text-title -mb-3 px-1 pt-3">{t('title')}</h1>
      {portal.isError ? (
        <Alert variant="danger" role="alert">
          {t('error')}
        </Alert>
      ) : null}
      {portal.data?.registrations.length === 0 ? <EmptyState icon={<InboxIcon />} title={t('none')} /> : null}
      {portal.data?.registrations.map((registration) => (
        <RegistrationCard key={registration.id} registration={registration} />
      ))}
    </PortalColumn>
  );
}
