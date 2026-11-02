import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@repo/schema/shared';

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
      <div className="flex flex-col items-start gap-4">
        <output className="block">{t('new.done')}</output>
        <Link to="/platform/prihlaseni" className={buttonVariants()}>
          {t('new.logIn')}
        </Link>
      </div>
    );
  }

  if (failure === 'password_reset_invalid') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="alert">{t('new.failure.password_reset_invalid')}</p>
        <Link to="/platform/zapomenute-heslo" className={buttonVariants()}>
          {t('new.requestAgain')}
        </Link>
      </div>
    );
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
        <p role="alert" className="text-sm text-destructive">
          {t(`new.failure.${failure}`)}
        </p>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('new.submit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
