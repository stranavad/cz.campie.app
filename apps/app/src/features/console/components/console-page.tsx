import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { TotpEnrolment } from '@/core/two-step';
import { OrganisationList } from '@/features/console/components/organisation-list/organisation-list';
import { ProblemReports } from '@/features/console/components/problem-reports/problem-reports';
import { SupportList } from '@/features/console/components/support-list/support-list';
import { useConsolePage } from '@/features/console/components/use-console-page.hook';

// The Platform operator's console: never without a TOTP code in this session, which the shell asks for.
export function ConsolePage() {
  const { t } = useTranslation('console');
  const page = useConsolePage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
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

  return (
    <>
      {header}
      {page.step === 'enrol' ? <TotpEnrolment intro={t('enrolmentIntro')} /> : null}
      {page.step === 'organisations' ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <OrganisationList organisations={page.organisations} pendingCount={page.pendingCount} />
          <div className="flex min-w-0 flex-col gap-6">
            <SupportList />
            <ProblemReports />
          </div>
        </div>
      ) : null}
    </>
  );
}
