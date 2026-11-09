import { Link } from '@tanstack/react-router';
import { TentIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicOrganisation } from '@repo/schema/organisations';

import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import type { ShellHeaderKind } from '@/core/organisation-shell/hooks/use-organisation-shell.hook';

interface OrganisationHeaderProps {
  organisation: PublicOrganisation | undefined;
  kind: Exclude<ShellHeaderKind, 'none'>;
  // Signing out of the portal, shown on its home.
  portalAction: ReactNode;
}

// The Organisation's logo (or a mark in its accent) and name, leading to its landing; on the public pages
// the way to the guardian portal and the theme switch, on the portal's home signing out. A step of a flow
// (the form, a payment, signing in) keeps only the Organisation, so nothing leads away from it.
export function OrganisationHeader({ organisation, kind, portalAction }: OrganisationHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3.5">
      <Link to="/organisation" className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full">
        {organisation === undefined ? null : organisation.logoUrl === null ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <TentIcon aria-hidden="true" className="size-5" />
          </span>
        ) : (
          <img
            src={organisation.logoUrl}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full bg-logo-plate object-contain"
          />
        )}
        <span className="truncate font-bold">{organisation?.displayName}</span>
      </Link>
      {kind === 'plain' ? null : <ThemeToggle />}
      {kind !== 'public' || organisation === undefined ? null : (
        <Link
          to="/organisation/portal"
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-11' })}
        >
          {t('organisationShell.portal')}
        </Link>
      )}
      {kind === 'portal' ? portalAction : null}
    </header>
  );
}
