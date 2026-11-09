import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { useAccountNameForm } from '@/features/account-settings/components/account-name-form/use-account-name-form.hook';

interface AccountNameFormProps {
  firstName: string | null;
  lastName: string | null;
}

// The admin's own name, as their team, invitations and the audit log show it.
export function AccountNameForm({ firstName, lastName }: AccountNameFormProps) {
  const { t } = useTranslation();
  const { form, failed, isSaved } = useAccountNameForm({ firstName, lastName });

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="firstName">
          {(field) => <field.TextField label={t('accountSettings.firstName')} autoComplete="given-name" />}
        </form.AppField>
        <form.AppField name="lastName">
          {(field) => <field.TextField label={t('accountSettings.lastName')} autoComplete="family-name" />}
        </form.AppField>
      </div>
      {failed ? (
        <Alert variant="danger" role="alert">
          {t('accountSettings.failure.unexpected')}
        </Alert>
      ) : null}
      {isSaved ? (
        <Alert variant="success">
          <output className="block">{t('accountSettings.nameSaved')}</output>
        </Alert>
      ) : null}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('accountSettings.saveName')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
