import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { config } from '@/config';
import { AdminFeedback } from '@/core/platform-shell/components/admin-feedback';
import { LogOutButton } from '@/core/platform-shell/components/log-out-button';
import { SupportBanner } from '@/core/platform-shell/components/support-banner';
import { TwoStepGate } from '@/core/two-step';

// Signup, the admin interface and the operator console on the main host.
export function PlatformShell() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-baseline gap-3 px-4 pt-4">
          <span className="text-lg font-semibold">{config.productName}</span>
          <span className="text-sm text-muted-foreground">{t('platformShell.tagline')}</span>
          <LogOutButton />
        </div>
      </header>
      <SupportBanner />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <TwoStepGate>
          <Outlet />
        </TwoStepGate>
      </main>
      <AdminFeedback />
    </div>
  );
}
