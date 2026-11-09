import { Outlet } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { DEFAULT_ACCENT_COLOUR } from '@repo/schema/organisations';

import { brandAttributes } from '@/core/branding';
import { OrganisationFooter } from '@/core/organisation-shell/components/organisation-footer';
import { OrganisationHeader } from '@/core/organisation-shell/components/organisation-header';
import { ShellNotice } from '@/core/organisation-shell/components/shell-notice';
import { useOrganisationShell } from '@/core/organisation-shell/hooks/use-organisation-shell.hook';

interface OrganisationShellProps {
  // Signing out of the guardian portal, shown in the header on the portal's home.
  portalAction: ReactNode;
}

// Public pages and the guardian portal on an Organisation's subdomain, branded with its logo, name and
// accent colour, or only a notice when the Platform operator has suspended it. Phone first: one centred
// column on a desktop.
export function OrganisationShell({ portalAction }: OrganisationShellProps) {
  const shell = useOrganisationShell();

  return (
    <div
      className="flex min-h-dvh flex-col bg-background"
      // Guardians' pickers and confirmations take the accent instead of near-black (styling.md).
      data-actions="brand"
      {...brandAttributes(shell.organisation?.accentColour ?? DEFAULT_ACCENT_COLOUR)}
    >
      {shell.header === 'none' && !shell.isSuspended && !shell.isUnknown ? null : (
        <OrganisationHeader
          organisation={shell.organisation}
          kind={shell.header === 'none' ? 'plain' : shell.header}
          portalAction={portalAction}
        />
      )}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4">
        {/* Nothing below mounts before the Organisation is known, so a suspended one's pages never start. */}
        {shell.isPending ? null : shell.isSuspended ? (
          <ShellNotice kind="suspended" />
        ) : shell.isUnknown ? (
          <ShellNotice kind="unknown" />
        ) : (
          <Outlet />
        )}
      </main>
      <OrganisationFooter name={shell.organisation?.displayName} />
    </div>
  );
}
