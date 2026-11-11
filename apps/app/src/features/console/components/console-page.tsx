import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { LoginRedirect } from '@/core/account';
import { TotpEnrolment } from '@/core/two-step';
import type { ConsoleSection } from '@/features/console/components/console-section.constant';
import { ConsoleTabs } from '@/features/console/components/console-tabs';
import { MailDelivery } from '@/features/console/components/mail-delivery/mail-delivery';
import { OrganisationTable } from '@/features/console/components/organisation-table/organisation-table';
import { ProblemReports } from '@/features/console/components/problem-reports/problem-reports';
import { SupportList } from '@/features/console/components/support-list/support-list';
import { useConsolePage } from '@/features/console/components/use-console-page.hook';

interface ConsolePageProps {
  section: ConsoleSection;
}

// The Platform operator's console: never without a TOTP code in this session, which the shell asks for.
// Its sections are tabs, each counting what waits in it.
export function ConsolePage({ section }: ConsolePageProps) {
  const { t } = useTranslation('console');
  const page = useConsolePage();

  if (page.isSignedOut) {
    return <LoginRedirect />;
  }

  const header = <PageHeader title={t('title')} />;

  if (page.isLoading) {
    return (
      <>
        {header}
        <p className="text-muted-foreground">{t('loading')}</p>
      </>
    );
  }

  if (page.isNotOperator) {
    return (
      <>
        {header}
        <Alert>{t('notOperator')}</Alert>
      </>
    );
  }

  if (page.isError) {
    return (
      <>
        {header}
        <Alert variant="danger">{t('error')}</Alert>
      </>
    );
  }

  if (page.step === 'enrol') {
    return (
      <>
        {header}
        <TotpEnrolment intro={t('enrolmentIntro')} />
      </>
    );
  }

  return (
    <>
      {header}
      <ConsoleTabs current={section} counts={page.counts} />
      {section === 'organisations' ? <OrganisationTable organisations={page.organisations} /> : null}
      {section === 'reports' ? <ProblemReports /> : null}
      {section === 'mail' ? <MailDelivery organisations={page.organisations} /> : null}
      {section === 'support' ? <SupportList /> : null}
    </>
  );
}
