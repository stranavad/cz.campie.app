import { Outlet } from '@tanstack/react-router';

import { DEFAULT_ACCENT_COLOUR } from '@repo/schema/organisations';

import { brandAttributes } from '@/core/branding';
import { OrganisationFooter } from '@/core/organisation-shell/components/organisation-footer';
import { OrganisationHeader } from '@/core/organisation-shell/components/organisation-header';
import { ShellNotice } from '@/core/organisation-shell/components/shell-notice';
import { useOrganisationShell } from '@/core/organisation-shell/hooks/use-organisation-shell.hook';

// Public pages and the guardian portal on an Organisation's subdomain, branded with its logo, name and
// accent colour, or only a notice when the Platform operator has suspended it. Phone first: one centred
// column on a desktop.
export function OrganisationShell() {
  const shell = useOrganisationShell();

  return (
    <div
      className="flex min-h-dvh flex-col bg-background"
      {...brandAttributes(shell.organisation?.accentColour ?? DEFAULT_ACCENT_COLOUR)}
    >
      <OrganisationHeader organisation={shell.organisation} />
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
