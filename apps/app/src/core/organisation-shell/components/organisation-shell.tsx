import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { usePublicOrganisationQuery } from '@/core/organisation-shell/api/public-organisation.queries';
import { HttpError } from '@/lib/api';

// Public pages and the guardian portal on an Organisation's subdomain, or only a notice when the
// Platform operator has suspended it. Branding comes with issue 23.
export function OrganisationShell() {
  const { t } = useTranslation();
  const organisation = usePublicOrganisationQuery();
  const isSuspended = organisation.error instanceof HttpError && organisation.error.code === 'organisation_suspended';

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4 text-lg font-semibold">
          {organisation.data?.displayName}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4">
        {/* Nothing below mounts before the Organisation is known, so a suspended one's pages never start. */}
        {organisation.isPending ? null : isSuspended ? (
          <section className="flex flex-col gap-3 py-12">
            <h1 className="text-2xl font-semibold">{t('organisationShell.suspended.title')}</h1>
            <p className="text-muted-foreground">{t('organisationShell.suspended.description')}</p>
          </section>
        ) : (
          <Outlet />
        )}
      </main>
      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground">
        {t('organisationShell.poweredBy')}
      </footer>
    </div>
  );
}
