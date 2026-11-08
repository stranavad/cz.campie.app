import { useTranslation } from 'react-i18next';

import { feedbackService, ProblemForm } from '@/core/feedback';

interface OrganisationFooterProps {
  name: string | undefined;
}

// The Organisation's name, a way to report a problem with the website itself, and the platform it runs on.
export function OrganisationFooter({ name }: OrganisationFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="mx-auto flex w-full max-w-2xl flex-col items-start gap-1.5 px-5 pt-6 pb-8 text-[13px] text-muted-foreground">
      {name === undefined ? null : <span className="font-bold text-foreground">{name}</span>}
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
