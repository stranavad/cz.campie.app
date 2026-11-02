import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { ForgottenPasswordForm } from '@/features/password-reset/components/forgotten-password-form/forgotten-password-form';

export function ForgottenPasswordPage() {
  const { t } = useTranslation('passwordReset');

  return (
    <section className="flex max-w-sm flex-col gap-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('forgotten.title')}</h1>
        <p className="text-muted-foreground">{t('forgotten.intro')}</p>
      </header>
      <ForgottenPasswordForm />
      <Link to="/platform/prihlaseni" className="text-sm underline underline-offset-4">
        {t('backToLogin')}
      </Link>
    </section>
  );
}
