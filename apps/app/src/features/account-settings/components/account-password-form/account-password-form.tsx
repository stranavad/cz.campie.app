import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@repo/schema/shared';

import { Alert } from '@/components/ui/alert';
import { useAccountPasswordForm } from '@/features/account-settings/components/account-password-form/use-account-password-form.hook';

interface AccountPasswordFormProps {
  email: string;
}

// A new password with the current one; every other login of the account ends.
export function AccountPasswordForm({ email }: AccountPasswordFormProps) {
  const { t } = useTranslation();
  const { form, failure, isChanged } = useAccountPasswordForm(email);

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-bold">{t('accountSettings.changePassword')}</h3>
        <p className="text-sm text-muted-foreground">{t('accountSettings.changePasswordIntro')}</p>
      </div>
      <form.AppField name="currentPassword">
        {(field) => (
          <field.TextField
            label={t('accountSettings.currentPassword')}
            type="password"
            autoComplete="current-password"
          />
        )}
      </form.AppField>
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label={t('accountSettings.newPassword')}
            description={t('accountSettings.newPasswordHint', { count: PASSWORD_MIN_LENGTH })}
            type="password"
            autoComplete="new-password"
          />
        )}
      </form.AppField>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`accountSettings.failure.${failure}`)}
        </Alert>
      )}
      {isChanged ? (
        <Alert variant="success">
          <output className="block">{t('accountSettings.passwordChanged')}</output>
        </Alert>
      ) : null}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('accountSettings.savePassword')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
