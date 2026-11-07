import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { DEFAULT_ACCENT_COLOUR } from '@repo/schema/organisations';

import { feedbackService, ProblemForm } from '@/core/feedback';
import { usePublicOrganisationQuery } from '@/core/organisation-shell/api/public-organisation.queries';
import { brandTokens } from '@/core/organisation-shell/brand-tokens.helper';
import { HttpError } from '@/lib/api';

// Public pages and the guardian portal on an Organisation's subdomain, branded with its logo, name and
// accent colour, or only a notice when the Platform operator has suspended it.
export function OrganisationShell() {
  const { t } = useTranslation();
  const organisation = usePublicOrganisationQuery();
  const isSuspended = organisation.error instanceof HttpError && organisation.error.code === 'organisation_suspended';
  // Unknown, or awaiting approval: its pages are not public yet.
  const isUnknown = organisation.error instanceof HttpError && organisation.error.code === 'organisation_unknown';
  const logoUrl = organisation.data?.logoUrl ?? null;

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={brandTokens(organisation.data?.accentColour ?? DEFAULT_ACCENT_COLOUR)}
    >
      <header className="border-b-4 border-primary">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4 text-lg font-semibold">
          {logoUrl === null ? null : <img src={logoUrl} alt="" className="h-10 w-auto" />}
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
        ) : isUnknown ? (
          <section className="flex flex-col gap-3 py-12">
            <h1 className="text-2xl font-semibold">{t('organisationShell.unknown.title')}</h1>
            <p className="text-muted-foreground">{t('organisationShell.unknown.description')}</p>
          </section>
        ) : (
          <Outlet />
        )}
      </main>
      <footer className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground">
        {/* Apart from the camp's contact: this reaches the platform's people, for the website itself. */}
        <ProblemForm
          label={t('feedback.technicalLink')}
          askEmail
          send={(text, email) => feedbackService.report({ text, email, pageUrl: window.location.href.slice(0, 500) })}
        />
        {t('organisationShell.poweredBy')}
      </footer>
    </div>
  );
}
