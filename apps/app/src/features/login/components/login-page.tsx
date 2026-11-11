import { Link } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { LoginForm } from '@/features/login/components/login-form/login-form';

interface LoginPageProps {
  // The address the admin asked for before being sent here; untrusted, the form checks it.
  returnTo: string | undefined;
}

export function LoginPage({ returnTo }: LoginPageProps) {
  const { t } = useTranslation('login');

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 py-4 sm:py-10">
      <Card className="gap-4 rounded-[28px] sm:p-7">
        <h1 className="text-card-title">{t('title')}</h1>
        <LoginForm returnTo={returnTo} />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        <Trans
          t={t}
          i18nKey="signup"
          components={{
            a: (
              <Link
                to="/platform/registrace-organizace"
                className="font-semibold text-foreground underline underline-offset-4"
              />
            ),
          }}
        />
      </p>
    </div>
  );
}
