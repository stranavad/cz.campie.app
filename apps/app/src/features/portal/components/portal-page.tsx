import { Navigate } from '@tanstack/react-router';
import { InboxIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { RegistrationCard } from '@/features/portal/components/home/registration-card';
import { usePortalPage } from '@/features/portal/components/home/use-portal-page.hook';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';

// The signed-in guardian's Registrations in the subdomain's Organisation, past ones included. Signing out
// sits in the shell's header.
export function PortalPage() {
  const { t } = useTranslation('portal');
  const { portal, isSignedOut, greetingName } = usePortalPage();

  if (isSignedOut) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (portal.isPending) {
    return null;
  }

  return (
    <PortalColumn className="gap-6">
      <h1 className="text-title -mb-3 px-1 pt-3">
        {greetingName === null ? t('title') : t('greeting', { name: greetingName })}
      </h1>
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
