import { Link, Outlet } from '@tanstack/react-router';

import { CampieMark } from '@/components/campie-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { config } from '@/config';
import { LegalFooter } from '@/core/platform-shell/components/legal-footer';

// The platform's own pages for visitors: its mark, the page, the legal links.
// The page renders at once, without waiting for the session check, so the login form is there even on a
// slow network; a signed-in admin's page moves into the admin layout once the account arrives.
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
        <Link to="/platform" className="flex items-center gap-3 rounded-full">
          <CampieMark />
          <span className="font-display text-xl font-extrabold tracking-[-0.02em]">{config.productName}</span>
        </Link>
        <ThemeToggle className="ml-auto" />
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-4 pb-12 sm:px-6">
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}
