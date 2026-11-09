import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { useLoginForm } from '@/features/login/components/login-form/use-login-form.hook';

export function LoginForm() {
  const { t } = useTranslation('login');
  const { form, failure } = useLoginForm();

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="email">
        {(field) => <field.TextField label={t('email')} type="email" autoComplete="username" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => <field.TextField label={t('password')} type="password" autoComplete="current-password" />}
      </form.AppField>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`failure.${failure}`)}
        </Alert>
      )}
      <form.AppForm>
        <form.SubmitButton size="lg" className="mt-1 w-full">
          {t('submit')}
        </form.SubmitButton>
      </form.AppForm>
      <Link
        to="/platform/zapomenute-heslo"
        className="flex min-h-11 items-center self-center text-sm font-semibold underline underline-offset-4"
      >
        {t('forgottenPassword')}
      </Link>
    </form>
  );
}
