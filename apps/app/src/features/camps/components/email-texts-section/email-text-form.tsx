import { EyeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { CampEmailText } from '@repo/schema/emails';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailPlaceholders } from '@/features/camps/components/email-texts-section/email-placeholders';
import { EmailPreview } from '@/features/camps/components/email-texts-section/email-preview';
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
  const { form, formRef, rememberFocus, status, placeholders, preview, showPreview, reset, insert } = useEmailTextForm(
    organisationId,
    campId,
    email,
  );

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <CardHeader className="items-center">
        <CardTitle>{t(`emails.types.${email.type}`)}</CardTitle>
        <Badge variant={email.enabled ? (email.customised ? 'brand' : 'neutral') : 'warning'}>
          {email.enabled ? (email.customised ? t('emails.own') : t('emails.default')) : t('emails.off')}
        </Badge>
        <Button type="button" variant="outline" size="sm" onClick={showPreview}>
          <EyeIcon aria-hidden="true" />
          {t('emails.preview')}
        </Button>
      </CardHeader>
      <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-5">
        <form.AppField name="subject">
          {(field) => <field.TextField label={t('emails.subject')} onFocus={() => rememberFocus('subject')} />}
        </form.AppField>
        <form.AppField name="text">
          {(field) => <field.TextAreaField label={t('emails.text')} rows={8} onFocus={() => rememberFocus('text')} />}
        </form.AppField>
        <EmailPlaceholders placeholders={placeholders} onInsert={insert} />
        {email.canSwitchOff ? (
          <form.AppField name="enabled">{(field) => <field.CheckboxField label={t('emails.enabled')} />}</form.AppField>
        ) : (
          <p className="text-[13px] text-muted-foreground">{t('emails.alwaysSent')}</p>
        )}
        <p className="text-[13px] text-muted-foreground">{t('emails.footerNote')}</p>
      </fieldset>
      {status === null ? null : (
        <Alert variant={status === 'saved' ? 'success' : 'danger'} role={status === 'saved' ? 'status' : 'alert'}>
          {t(status === 'saved' ? 'saved' : 'failure')}
        </Alert>
      )}
      {canWrite ? (
        <CardFooter className="justify-end">
          {email.customised ? (
            <Button type="button" variant="ghost" onClick={reset}>
              {t('emails.reset')}
            </Button>
          ) : null}
          <form.AppForm>
            <form.SubmitButton>{t('save')}</form.SubmitButton>
          </form.AppForm>
        </CardFooter>
      ) : null}
      {preview === null ? null : <EmailPreview subject={preview.subject} html={preview.html} />}
    </form>
  );
}
