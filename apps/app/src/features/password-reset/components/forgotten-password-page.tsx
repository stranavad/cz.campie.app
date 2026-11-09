import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { ForgottenPasswordForm } from '@/features/password-reset/components/forgotten-password-form/forgotten-password-form';

export function ForgottenPasswordPage() {
  const { t } = useTranslation('passwordReset');

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 py-4 sm:py-10">
      <Card className="gap-4 rounded-[28px] sm:p-7">
        <header className="flex flex-col gap-2">
          <h1 className="text-card-title">{t('forgotten.title')}</h1>
          <p className="text-muted-foreground">{t('forgotten.intro')}</p>
        </header>
        <ForgottenPasswordForm />
      </Card>
      <Link
        to="/platform/prihlaseni"
        className="flex min-h-11 items-center self-center text-sm font-semibold underline underline-offset-4"
      >
        {t('backToLogin')}
      </Link>
    </div>
  );
}
