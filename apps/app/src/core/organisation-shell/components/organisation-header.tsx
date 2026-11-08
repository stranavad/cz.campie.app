import { Link } from '@tanstack/react-router';
import { TentIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicOrganisation } from '@repo/schema/organisations';

import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';

interface OrganisationHeaderProps {
  organisation: PublicOrganisation | undefined;
}

// The Organisation's logo (or a mark in its accent) and name, leading to its landing; the way to the
// guardian portal and the theme switch.
export function OrganisationHeader({ organisation }: OrganisationHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3.5">
      <Link to="/organisation" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full">
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
      <ThemeToggle />
      {organisation === undefined ? null : (
        <Link
          to="/organisation/portal"
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-11' })}
        >
          {t('organisationShell.portal')}
        </Link>
      )}
    </header>
  );
}
