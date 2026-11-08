import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { useInviteForm } from '@/features/members/components/invite-form/use-invite-form.hook';
import { PermissionsFieldset } from '@/features/members/components/permissions-fieldset/permissions-fieldset';

interface InviteFormProps {
  organisationId: string;
  // The page header's "Pozvat člena" jumps here.
  anchorId: string;
}

export function InviteForm({ organisationId, anchorId }: InviteFormProps) {
  const { t } = useTranslation('members');
  const { form, sentTo, hasFailed } = useInviteForm(organisationId);

  return (
    <Card id={anchorId} className="scroll-mt-20">
      <CardHeader className="flex-col gap-1">
        <CardTitle>{t('invite.title')}</CardTitle>
        <CardDescription className="max-w-2xl">{t('invite.intro')}</CardDescription>
      </CardHeader>
      <form
        noValidate
        className="flex max-w-lg flex-col gap-5"
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
        <form.AppForm>
          <form.SubmitButton className="self-start">{t('invite.submit')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </Card>
  );
}
