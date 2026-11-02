import { useTranslation } from 'react-i18next';

import { NewPasswordForm } from '@/features/password-reset/components/new-password-form/new-password-form';

interface NewPasswordPageProps {
  token: string;
}

export function NewPasswordPage({ token }: NewPasswordPageProps) {
  const { t } = useTranslation('passwordReset');

  return (
    <section className="flex max-w-sm flex-col gap-6 py-12">
      <h1 className="text-2xl font-semibold">{t('new.title')}</h1>
      <NewPasswordForm token={token} />
    </section>
  );
}
