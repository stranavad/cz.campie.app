import { useTranslation } from 'react-i18next';

import type { CampEmailText } from '@repo/schema/emails';

import { Button } from '@/components/ui/button';
import { useEmailTextForm } from '@/features/camps/components/email-texts-section/use-email-text-form.hook';

interface EmailTextFormProps {
  organisationId: string;
  campId: string;
  email: CampEmailText;
  canWrite: boolean;
}

// One email type's subject and text, whether it is sent, and a preview with made-up data.
export function EmailTextForm({ organisationId, campId, email, canWrite }: EmailTextFormProps) {
  const { t } = useTranslation('camps');
  const { form, status, preview, showPreview, reset } = useEmailTextForm(organisationId, campId, email);

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <fieldset disabled={!canWrite} className="flex flex-col gap-4">
        <form.AppField name="subject">{(field) => <field.TextField label={t('emails.subject')} />}</form.AppField>
        <form.AppField name="text">
          {(field) => <field.TextAreaField label={t('emails.text')} rows={8} />}
        </form.AppField>
        <p className="text-sm text-muted-foreground">
          {t('emails.placeholders', { names: email.placeholders.map((name) => `{{${name}}}`).join(', ') })}
        </p>
        {email.canSwitchOff ? (
          <form.AppField name="enabled">{(field) => <field.CheckboxField label={t('emails.enabled')} />}</form.AppField>
        ) : (
          <p className="text-sm text-muted-foreground">{t('emails.alwaysSent')}</p>
        )}
      </fieldset>
      {status === null ? null : (
        <p role={status === 'saved' ? 'status' : 'alert'} className="text-sm">
          {t(status === 'saved' ? 'saved' : 'failure')}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <>
            <form.AppForm>
              <form.SubmitButton>{t('save')}</form.SubmitButton>
            </form.AppForm>
            {email.customised ? (
              <Button type="button" variant="ghost" onClick={reset}>
                {t('emails.reset')}
              </Button>
            ) : null}
          </>
        ) : null}
        <Button type="button" variant="outline" onClick={showPreview}>
          {t('emails.preview')}
        </Button>
      </div>
      {preview === null ? null : (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{t('emails.previewSubject', { subject: preview.subject })}</p>
          {/* Sandboxed: the preview is HTML, rendered without scripts or a way out. */}
          <iframe
            title={t('emails.preview')}
            sandbox=""
            srcDoc={preview.html}
            className="h-96 w-full rounded-lg border border-border"
          />
        </div>
      )}
    </form>
  );
}
