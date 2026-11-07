import { Navigate, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useGuardianRegistrationsQuery, useGuardianSignOutMutation } from '@/features/portal/api/portal.queries';
import { HttpError } from '@/lib/api';

// The signed-in guardian's Registrations in the subdomain's Organisation.
export function PortalPage() {
  const { t } = useTranslation('portal');
  const navigate = useNavigate();
  const registrations = useGuardianRegistrationsQuery();
  const signOut = useGuardianSignOutMutation();

  if (registrations.error instanceof HttpError && registrations.error.status === 401) {
    return <Navigate to="/organisation/portal/prihlaseni" replace />;
  }

  if (registrations.isPending) {
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
      {registrations.isError ? <p role="alert">{t('error')}</p> : null}
      {registrations.data?.length === 0 ? <p>{t('none')}</p> : null}
      <ul className="flex flex-col gap-4">
        {registrations.data?.map((registration) => (
          <li key={registration.id} className="rounded-lg border p-4">
            <p className="font-medium">
              {t('registrationTitle', { camp: registration.campName, turnus: registration.turnusName })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('variableSymbol', { symbol: registration.variableSymbol })}
            </p>
            <p className="text-sm">
              {registration.participants.map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', ')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
