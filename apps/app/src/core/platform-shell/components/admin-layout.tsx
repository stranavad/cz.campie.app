import { Outlet } from '@tanstack/react-router';
import { MenuIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_ACCENT_COLOUR } from '@repo/schema/organisations';

import { Button } from '@/components/ui/button';
import { useCurrentMembership } from '@/core/account';
import { brandAttributes } from '@/core/branding';
import { AdminFeedback } from '@/core/platform-shell/components/admin-feedback';
import { AdminSidebar } from '@/core/platform-shell/components/admin-sidebar';
import { EmailVerificationBanner } from '@/core/platform-shell/components/email-verification-banner';
import { LegalFooter } from '@/core/platform-shell/components/legal-footer';
import { OrganisationBadge } from '@/core/platform-shell/components/organisation-badge';
import { SupportBanner } from '@/core/platform-shell/components/support-banner';
import { useDrawer } from '@/core/platform-shell/components/use-drawer.hook';
import { TwoStepGate } from '@/core/two-step';

// The admin interface: a fixed sidebar from a laptop's width up; on a phone a top bar whose menu opens the
// same sidebar as a drawer. The drawer is a native modal <dialog>, so focus, Escape and the backdrop come
// from the browser, and it slides in with a transform only.
export function AdminLayout() {
  const { t } = useTranslation();
  const { membership } = useCurrentMembership();
  const { drawer, open, close } = useDrawer();

  return (
    <div
      className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]"
      {...brandAttributes(membership?.organisation.accentColour ?? DEFAULT_ACCENT_COLOUR)}
    >
      <aside className="sticky top-0 hidden h-dvh overflow-y-auto border-r border-border bg-card lg:block">
        <AdminSidebar />
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card px-3 py-2 lg:hidden">
        <Button variant="ghost" size="icon" aria-label={t('platformShell.menu.open')} onClick={open}>
          <MenuIcon className="size-5" />
        </Button>
        <OrganisationBadge compact />
      </header>

      {/* Keyboard users close it with Escape, which the modal dialog handles itself. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={drawer}
        aria-label={t('platformShell.menu.label')}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(86vw,18rem)] max-w-none -translate-x-full overflow-y-auto overscroll-contain border-r border-border bg-card p-0 text-foreground shadow-float transition-[translate,display,overlay] transition-discrete duration-200 ease-out backdrop:bg-black/40 backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-200 open:translate-x-0 open:backdrop:opacity-100 starting:open:-translate-x-full starting:open:backdrop:opacity-0 lg:hidden"
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself; a followed link closes the drawer too.
          if (event.target === event.currentTarget || (event.target as HTMLElement).closest('a')) {
            close();
          }
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3"
          aria-label={t('platformShell.menu.close')}
          onClick={() => close()}
        >
          <XIcon className="size-5" />
        </Button>
        <AdminSidebar />
      </dialog>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-dvh">
        <SupportBanner />
        <EmailVerificationBanner />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-6 pb-12 sm:px-6 lg:px-10 lg:pt-8">
          <TwoStepGate>
            <Outlet />
          </TwoStepGate>
        </main>
        <AdminFeedback />
        <LegalFooter />
      </div>
    </div>
  );
}
