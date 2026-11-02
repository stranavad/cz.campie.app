import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useLoginForm } from '@/features/login/components/login-form/use-login-form.hook';

export function LoginForm() {
  const { t } = useTranslation('login');
  const { form, failure } = useLoginForm();

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
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
        <p role="alert" className="text-sm text-destructive">
          {t(`failure.${failure}`)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <form.AppForm>
          <form.SubmitButton>{t('submit')}</form.SubmitButton>
        </form.AppForm>
        <Link to="/platform/zapomenute-heslo" className="text-sm underline underline-offset-4">
          {t('forgottenPassword')}
        </Link>
      </div>
    </form>
  );
}
