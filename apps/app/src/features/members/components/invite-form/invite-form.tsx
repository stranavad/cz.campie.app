import { useTranslation } from 'react-i18next';

import { useInviteForm } from '@/features/members/components/invite-form/use-invite-form.hook';
import { PermissionsFieldset } from '@/features/members/components/permissions-fieldset/permissions-fieldset';

interface InviteFormProps {
  organisationId: string;
}

export function InviteForm({ organisationId }: InviteFormProps) {
  const { t } = useTranslation('members');
  const { form, sentTo, hasFailed } = useInviteForm(organisationId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('invite.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('invite.intro')}</p>
      <form
        noValidate
        className="flex max-w-md flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="email">
          {(field) => <field.TextField label={t('invite.email')} type="email" autoComplete="off" />}
        </form.AppField>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t('invite.permissions')}</legend>
          <form.Field name="permissions">
            {(field) => <PermissionsFieldset value={field.state.value} onChange={field.handleChange} />}
          </form.Field>
        </fieldset>
        {sentTo === null ? null : <output className="block text-sm">{t('invite.sent', { email: sentTo })}</output>}
        {hasFailed ? (
          <p role="alert" className="text-sm text-destructive">
            {t('invite.failure')}
          </p>
        ) : null}
        <form.AppForm>
          <form.SubmitButton className="self-start">{t('invite.submit')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </section>
  );
}
