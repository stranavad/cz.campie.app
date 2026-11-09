import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { useForgottenPasswordForm } from '@/features/password-reset/components/forgotten-password-form/use-forgotten-password-form.hook';

export function ForgottenPasswordForm() {
  const { t } = useTranslation('passwordReset');
  const { form, isSent, failure } = useForgottenPasswordForm();

  // The same answer whether or not the email has an account.
  if (isSent) {
    return (
      <Alert variant="success" className="font-semibold">
        <output className="block">{t('forgotten.sent')}</output>
      </Alert>
    );
  }

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
        {(field) => <field.TextField label={t('forgotten.email')} type="email" autoComplete="username" />}
      </form.AppField>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`forgotten.failure.${failure}`)}
        </Alert>
      )}
      <form.AppForm>
        <form.SubmitButton size="lg" className="mt-1 w-full">
          {t('forgotten.submit')}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
