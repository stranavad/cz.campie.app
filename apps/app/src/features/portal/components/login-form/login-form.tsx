import { useTranslation } from 'react-i18next';

import { useLoginForm } from '@/features/portal/components/login-form/use-login-form.hook';

export function LoginForm() {
  const { t } = useTranslation('portal');
  const { form, isSent, failure } = useLoginForm();

  // The same answer whether or not the email is on a Registration.
  if (isSent) {
    return <output className="block">{t('login.sent')}</output>;
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
        {(field) => <field.TextField label={t('login.email')} type="email" autoComplete="email" />}
      </form.AppField>
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`login.failure.${failure}`)}
        </p>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('login.submit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
