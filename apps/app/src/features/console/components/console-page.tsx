import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

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

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.isNotOperator) {
    return <p className="py-12">{t('notOperator')}</p>;
  }

  if (page.isError) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return (
    <div className="py-12">
      {page.step === 'enrol' ? <TotpEnrolment intro={t('enrolmentIntro')} /> : null}
      {page.step === 'organisations' ? (
        <div className="flex flex-col gap-10">
          <SupportList />
          <ProblemReports />
          <OrganisationList organisations={page.organisations} />
        </div>
      ) : null}
    </div>
  );
}
