import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
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
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p className="text-sm text-muted-foreground">{t('newAccount.intro')}</p>
      <div className="grid items-start gap-4 sm:grid-cols-2 sm:gap-3">
        <form.AppField name="firstName">
          {(field) => <field.TextField label={t('newAccount.firstName')} autoComplete="given-name" />}
        </form.AppField>
        <form.AppField name="lastName">
          {(field) => <field.TextField label={t('newAccount.lastName')} autoComplete="family-name" />}
        </form.AppField>
      </div>
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
        <Alert variant="danger" role="alert">
          {t(`failure.${failure}`)}
        </Alert>
      )}
      <form.AppForm>
        <form.SubmitButton size="lg" className="mt-1 w-full">
          {t('accept')}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
