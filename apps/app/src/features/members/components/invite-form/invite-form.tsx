import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { useInviteForm } from '@/features/members/components/invite-form/use-invite-form.hook';
import { PermissionsFieldset } from '@/features/members/components/permissions-fieldset/permissions-fieldset';

interface InviteFormProps {
  organisationId: string;
}

// The invitee's email and levels, inside the invite dialog; it stays open after sending for the next one.
export function InviteForm({ organisationId }: InviteFormProps) {
  const { t } = useTranslation('members');
  const { form, sentTo, hasFailed } = useInviteForm(organisationId);

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
        {(field) => <field.TextField label={t('invite.email')} type="email" autoComplete="off" />}
      </form.AppField>
      <FieldSet>
        <FieldLegend variant="label">{t('invite.permissions')}</FieldLegend>
        <form.Field name="permissions">
          {(field) => <PermissionsFieldset value={field.state.value} onChange={field.handleChange} />}
        </form.Field>
      </FieldSet>
      {sentTo === null ? null : (
        <output className="block">
          <Alert variant="success">{t('invite.sent', { email: sentTo })}</Alert>
        </output>
      )}
      {hasFailed ? (
        <Alert variant="danger" role="alert">
          {t('invite.failure')}
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <DialogClose render={<Button type="button" variant="ghost" />}>{t('invite.close')}</DialogClose>
        <form.AppForm>
          <form.SubmitButton>{t('invite.submit')}</form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
