import { MailIcon, PhoneIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PublicOrganisation } from '@repo/schema/organisations';

import { feedbackService, ProblemForm } from '@/core/feedback';
import { ContactLink } from '@/core/organisation-shell/components/contact-link';

interface OrganisationFooterProps {
  name: string | undefined;
  // The Organisation's contact, on pages that name no Camp's.
  contact: Pick<PublicOrganisation, 'contactEmail' | 'contactPhone'> | undefined;
}

// The Organisation's name and, where no Camp's contact is shown, how to reach it; a way to report a problem with the website itself, and the platform it runs on.
export function OrganisationFooter({ name, contact }: OrganisationFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="mx-auto flex w-full max-w-2xl flex-col items-start gap-1.5 px-5 pt-6 pb-8 text-[13px] text-muted-foreground">
      {name === undefined ? null : <span className="font-bold text-foreground">{name}</span>}
      {contact === undefined ? null : (
        <span className="flex flex-wrap gap-x-4">
          <ContactLink
            href={`mailto:${contact.contactEmail}`}
            icon={<MailIcon aria-hidden="true" className="size-3.5" />}
          >
            {contact.contactEmail}
          </ContactLink>
          <ContactLink
            href={`tel:${contact.contactPhone}`}
            icon={<PhoneIcon aria-hidden="true" className="size-3.5" />}
          >
            {contact.contactPhone}
          </ContactLink>
        </span>
      )}
      {/* Apart from the camp's contact: this reaches the platform's people, for the website itself. */}
      <ProblemForm
        label={t('feedback.technicalLink')}
        title={t('feedback.technicalTitle')}
        description={t('feedback.technicalDescription')}
        askEmail
        send={(text, email) =>
          feedbackService.report({ text, email, pageUrl: `${window.location.origin}${window.location.pathname}` })
        }
      />
      <span className="text-subtle-foreground">{t('organisationShell.poweredBy')}</span>
    </footer>
  );
}
