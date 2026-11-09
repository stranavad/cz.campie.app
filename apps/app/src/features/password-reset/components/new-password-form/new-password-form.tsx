import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { useNewPasswordForm } from '@/features/password-reset/components/new-password-form/use-new-password-form.hook';

interface NewPasswordFormProps {
  // From the emailed link; empty when the link carried none.
  token: string;
}

export function NewPasswordForm({ token }: NewPasswordFormProps) {
  const { t } = useTranslation('passwordReset');
  const { form, failure, isDone } = useNewPasswordForm(token);

  if (isDone) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success" className="font-semibold">
          <output className="block">{t('new.done')}</output>
        </Alert>
        <Link to="/platform/prihlaseni" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          {t('new.logIn')}
        </Link>
      </div>
    );
  }

  if (failure === 'password_reset_invalid') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="danger" role="alert">
          {t('new.failure.password_reset_invalid')}
        </Alert>
        <Link to="/platform/zapomenute-heslo" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          {t('new.requestAgain')}
        </Link>
      </div>
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
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label={t('new.password')}
            description={t('new.passwordHint', { count: PASSWORD_MIN_LENGTH })}
            type="password"
            autoComplete="new-password"
          />
        )}
      </form.AppField>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`new.failure.${failure}`)}
        </Alert>
      )}
      <form.AppForm>
        <form.SubmitButton size="lg" className="mt-1 w-full">
          {t('new.submit')}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
