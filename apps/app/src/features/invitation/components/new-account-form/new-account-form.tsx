import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@repo/schema/shared';

import { useNewAccountForm } from '@/features/invitation/components/new-account-form/use-new-account-form.hook';

interface NewAccountFormProps {
  token: string;
  email: string;
}

// The invitee without an account chooses a password and is signed in by accepting.
export function NewAccountForm({ token, email }: NewAccountFormProps) {
  const { t } = useTranslation('invitation');
  const { form, failure } = useNewAccountForm(token, email);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p className="text-sm text-muted-foreground">{t('newAccount.intro')}</p>
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label={t('newAccount.password')}
            description={t('newAccount.passwordHint', { count: PASSWORD_MIN_LENGTH })}
            type="password"
            autoComplete="new-password"
          />
        )}
      </form.AppField>
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`failure.${failure}`)}
        </p>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('accept')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
