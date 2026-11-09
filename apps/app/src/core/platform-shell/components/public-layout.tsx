import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { CampieMark } from '@/components/campie-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { config } from '@/config';
import { LegalFooter } from '@/core/platform-shell/components/legal-footer';
import { LegalTabs } from '@/core/platform-shell/components/legal-tabs';

// The platform's own pages for visitors: its mark, the page, the legal links. Signup offers the login in the
// header, a legal text the other legal texts.
// The page renders at once, without waiting for the session check, so the login form is there even on a
// slow network; a signed-in admin's page moves into the admin layout once the account arrives.
export function PublicLayout() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  const isSignup = matchRoute({ to: '/platform/registrace-organizace' }) !== false;
  const isLegal = ['/platform/podminky', '/platform/zpracovatelska-smlouva', '/platform/zpracovani-dat'].some(
    (to) => matchRoute({ to }) !== false,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-6">
        <Link to="/platform" className="flex items-center gap-2.5 rounded-full">
          <CampieMark />
          <span className="font-display text-xl font-extrabold tracking-[-0.02em]">{config.productName}</span>
        </Link>
        {isLegal ? <LegalTabs className="order-last w-full lg:order-none lg:w-auto lg:flex-1 lg:justify-end" /> : null}
        <div className="ml-auto flex items-center gap-2">
          {isSignup ? (
            <>
              <span className="hidden text-sm text-muted-foreground min-[400px]:inline">
                {t('platformShell.public.hasAccount')}
              </span>
              <Link to="/platform/prihlaseni" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                {t('platformShell.public.logIn')}
              </Link>
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-4 pb-12 sm:px-6">
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}
