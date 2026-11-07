import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useAccountQuery } from '@/core/account';
import { TotpEnrolment } from '@/core/two-step';
import { HttpError } from '@/lib/api';

// The signed-in admin's own account: who they are and their two-step login.
export function AccountSettingsPage() {
  const { t } = useTranslation();
  const account = useAccountQuery();

  if (account.error instanceof HttpError && account.error.status === 401) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (account.isPending) {
    return <p className="py-12 text-muted-foreground">{t('accountSettings.loading')}</p>;
  }

  if (account.isError) {
    return <p className="py-12 text-destructive">{t('accountSettings.error')}</p>;
  }

  return (
    <div className="flex flex-col gap-8 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('accountSettings.title')}</h1>
        <p className="text-muted-foreground">{account.data.email}</p>
      </div>
      {account.data.totpEnabled ? (
        <section className="flex max-w-xl flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('twoStep.enrolment.title')}</h2>
          <p>{t('accountSettings.totpOn')}</p>
        </section>
      ) : (
        <TotpEnrolment intro={t('twoStep.enrolment.voluntary')} />
      )}
    </div>
  );
}
