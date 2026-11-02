import { Link } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';

import { LoginForm } from '@/features/login/components/login-form/login-form';

export function LoginPage() {
  const { t } = useTranslation('login');

  return (
    <section className="flex max-w-sm flex-col gap-6 py-12">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        <Trans
          t={t}
          i18nKey="signup"
          components={{ a: <Link to="/platform/registrace-organizace" className="underline underline-offset-4" /> }}
        />
      </p>
    </section>
  );
}
