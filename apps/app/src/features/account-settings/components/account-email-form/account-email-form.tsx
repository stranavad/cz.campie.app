import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { useAccountEmailForm } from '@/features/account-settings/components/account-email-form/use-account-email-form.hook';

// A new email takes effect once the link mailed to it is followed; the current password guards it.
export function AccountEmailForm() {
  const { t } = useTranslation();
  const { form, failure, sentTo } = useAccountEmailForm();

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
        <h3 className="font-bold">{t('accountSettings.changeEmail')}</h3>
        <p className="text-sm text-muted-foreground">{t('accountSettings.changeEmailIntro')}</p>
      </div>
      <form.AppField name="email">
        {(field) => <field.TextField label={t('accountSettings.newEmail')} type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="currentPassword">
        {(field) => (
          <field.TextField
            label={t('accountSettings.currentPassword')}
            type="password"
            autoComplete="current-password"
          />
        )}
      </form.AppField>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`accountSettings.failure.${failure}`)}
        </Alert>
      )}
      {sentTo === null ? null : (
        <Alert variant="success">
          <output className="block">{t('accountSettings.emailLinkSent', { email: sentTo })}</output>
        </Alert>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('accountSettings.sendEmailLink')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
