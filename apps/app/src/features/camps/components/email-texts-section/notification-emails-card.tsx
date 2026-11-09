import { useTranslation } from 'react-i18next';

import type { Camp } from '@repo/schema/camps';

import { Card } from '@/components/ui/card';
import { useNotificationEmailsForm } from '@/features/camps/components/email-texts-section/use-notification-emails-form.hook';
import { SaveStatus } from '@/features/camps/components/save-status';

interface NotificationEmailsCardProps {
  organisationId: string;
  camp: Camp;
  canWrite: boolean;
}

// Who in the Camp's team hears of a new Registration, saved on its own.
export function NotificationEmailsCard({ organisationId, camp, canWrite }: NotificationEmailsCardProps) {
  const { t } = useTranslation('camps');
  const { form, status } = useNotificationEmailsForm(organisationId, camp);

  return (
    <Card className="p-5 sm:p-5">
      <form
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <fieldset disabled={!canWrite} className="min-w-0">
          <form.AppField name="notificationEmails">
            {(field) => (
              <field.TextAreaField
                label={t('emails.notificationEmails')}
                description={t('emails.notificationEmailsHint')}
                rows={3}
              />
            )}
          </form.AppField>
        </fieldset>
        {canWrite ? (
          <div className="flex flex-wrap items-center gap-3">
            <form.AppForm>
              <form.SubmitButton variant="outline">{t('save')}</form.SubmitButton>
            </form.AppForm>
            <SaveStatus status={status} />
          </div>
        ) : null}
      </form>
    </Card>
  );
}
