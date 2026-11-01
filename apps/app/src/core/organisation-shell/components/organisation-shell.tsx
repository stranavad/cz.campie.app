import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

// Public pages and the guardian portal on an Organisation's subdomain. Its name and branding come
// from the API once Organisations exist (issues 14, 23).
export function OrganisationShell() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto h-14 w-full max-w-3xl px-4" />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground">
        {t('organisationShell.poweredBy')}
      </footer>
    </div>
  );
}
