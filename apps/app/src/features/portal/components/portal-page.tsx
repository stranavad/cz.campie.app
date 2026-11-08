import { Navigate, useNavigate } from '@tanstack/react-router';
import { InboxIcon, LogOutIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGuardianRegistrationsQuery, useGuardianSignOutMutation } from '@/features/portal/api/portal.queries';
import { RegistrationCard } from '@/features/portal/components/home/registration-card';
import { groupsOf } from '@/features/portal/components/home/registration-groups.helper';
import { PortalColumn } from '@/features/portal/components/shared/portal-column';
import { HttpError } from '@/lib/api';

// The signed-in guardian's Registrations in the subdomain's Organisation, past ones included.
export function PortalPage() {
  const { t } = useTranslation('portal');
  const navigate = useNavigate();
  const portal = useGuardianRegistrationsQuery();
  const signOut = useGuardianSignOutMutation();

  if (portal.error instanceof HttpError && portal.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (portal.isPending) {
    return null;
  }

  return (
    <PortalColumn className="gap-6">
      <header className="flex items-start justify-between gap-3 pt-2">
        <h1 className="text-title">{t('title')}</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() =>
            signOut.mutate(undefined, {
              onSettled: () => void navigate({ to: '/organisation/portal/prihlaseni', replace: true }),
            })
          }
        >
          <LogOutIcon aria-hidden="true" />
          {t('signOut')}
        </Button>
      </header>
      {portal.isError ? (
        <Alert variant="danger" role="alert">
          {t('error')}
        </Alert>
      ) : null}
      {portal.data?.registrations.length === 0 ? <EmptyState icon={<InboxIcon />} title={t('none')} /> : null}
      {groupsOf(portal.data?.registrations ?? []).map((group) => (
        <section key={group.registrations[0]?.turnus.id} className="flex flex-col gap-3">
          <h2 className="text-heading px-1">{t('registrationTitle', { camp: group.camp, turnus: group.turnus })}</h2>
          {group.registrations.map((registration) => (
            <RegistrationCard key={registration.id} registration={registration} />
          ))}
        </section>
      ))}
      {portal.data === undefined ? null : (
        <p className="flex flex-wrap gap-1 px-1 text-[13px] text-muted-foreground">
          <span>{t('technicalContact')}</span>
          <a href={`mailto:${portal.data.technicalContact}`} className="underline underline-offset-2 wrap-anywhere">
            {portal.data.technicalContact}
          </a>
        </p>
      )}
    </PortalColumn>
  );
}
