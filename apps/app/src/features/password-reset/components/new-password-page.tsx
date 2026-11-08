import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { NewPasswordForm } from '@/features/password-reset/components/new-password-form/new-password-form';

interface NewPasswordPageProps {
  token: string;
}

export function NewPasswordPage({ token }: NewPasswordPageProps) {
  const { t } = useTranslation('passwordReset');

  return (
    <div className="mx-auto flex w-full max-w-md flex-col py-4 sm:py-10">
      <Card className="gap-5 rounded-[28px] sm:p-7">
        <h1 className="text-card-title">{t('new.title')}</h1>
        <NewPasswordForm token={token} />
      </Card>
    </div>
  );
}
