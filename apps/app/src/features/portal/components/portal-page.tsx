import { Navigate, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { GuardianRegistration } from '@repo/schema/portal';

import { Button } from '@/components/ui/button';
import { useGuardianRegistrationsQuery, useGuardianSignOutMutation } from '@/features/portal/api/portal.queries';
import { RegistrationCard } from '@/features/portal/components/registration-card';
import { HttpError } from '@/lib/api';

/**
 * Group Registrations by Camp and Turnus, in the order they come.
 * @param registrations the guardian's Registrations, newest first
 */
function groupsOf(registrations: readonly GuardianRegistration[]) {
  // A Turnus belongs to one Camp, so its id names the group; names repeat from year to year.
  const groups = new Map<string, { camp: string; turnus: string; registrations: GuardianRegistration[] }>();

  for (const registration of registrations) {
    const key = registration.turnus.id;
    const group = groups.get(key) ?? {
      camp: registration.camp.name,
      turnus: registration.turnus.name,
      registrations: [],
    };

    group.registrations.push(registration);
    groups.set(key, group);
  }

  return [...groups.values()];
}

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
    <section className="flex flex-col gap-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            signOut.mutate(undefined, {
              onSettled: () => void navigate({ to: '/organisation/portal/prihlaseni', replace: true }),
            })
          }
        >
          {t('signOut')}
        </Button>
      </header>
      {portal.isError ? <p role="alert">{t('error')}</p> : null}
      {portal.data?.registrations.length === 0 ? <p>{t('none')}</p> : null}
      {groupsOf(portal.data?.registrations ?? []).map((group) => (
        <section key={group.registrations[0]?.turnus.id} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            {t('registrationTitle', { camp: group.camp, turnus: group.turnus })}
          </h2>
          {group.registrations.map((registration) => (
            <RegistrationCard key={registration.id} registration={registration} />
          ))}
        </section>
      ))}
      {portal.data === undefined ? null : (
        <p className="flex flex-wrap gap-1 text-sm text-muted-foreground">
          <span>{t('technicalContact')}</span>
          <a href={`mailto:${portal.data.technicalContact}`} className="underline">
            {portal.data.technicalContact}
          </a>
        </p>
      )}
    </section>
  );
}
