import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { OrganisationList } from '@/features/console/components/organisation-list/organisation-list';
import { ProblemReports } from '@/features/console/components/problem-reports/problem-reports';
import { SupportList } from '@/features/console/components/support-list/support-list';
import { TotpCodeForm } from '@/features/console/components/totp-code-form/totp-code-form';
import { TotpEnrolment } from '@/features/console/components/totp-enrolment/totp-enrolment';
import { useConsolePage } from '@/features/console/components/use-console-page.hook';

// The Platform operator's console: never without a TOTP code in this session.
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
      {page.step === 'enrol' ? <TotpEnrolment /> : null}
      {page.step === 'verify' ? (
        <section className="flex max-w-xl flex-col gap-4">
          <h1 className="text-2xl font-semibold">{t('verify.title')}</h1>
          <p className="text-muted-foreground">{t('verify.intro')}</p>
          <TotpCodeForm purpose="verify" />
        </section>
      ) : null}
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
