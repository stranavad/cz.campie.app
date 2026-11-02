import { useTranslation } from 'react-i18next';

import { useForgottenPasswordForm } from '@/features/password-reset/components/forgotten-password-form/use-forgotten-password-form.hook';

export function ForgottenPasswordForm() {
  const { t } = useTranslation('passwordReset');
  const { form, isSent, hasFailed } = useForgottenPasswordForm();

  // The same answer whether or not the email has an account.
  if (isSent) {
    return <output className="block">{t('forgotten.sent')}</output>;
  }

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
        {(field) => <field.TextField label={t('forgotten.email')} type="email" autoComplete="username" />}
      </form.AppField>
      {hasFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('forgotten.failure')}
        </p>
      ) : null}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('forgotten.submit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
