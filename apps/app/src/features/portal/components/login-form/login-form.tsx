import { MailIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLoginForm } from '@/features/portal/components/login-form/use-login-form.hook';
import { NoticeCard } from '@/features/portal/components/shared/notice-card';
import { StatusMessage } from '@/features/portal/components/shared/status-message';

export function LoginForm() {
  const { t } = useTranslation('portal');
  const { form, sentTo, failure, isResending, isResent, resend } = useLoginForm();
  const failureMessage =
    failure === null ? null : <StatusMessage tone="danger">{t(`login.failure.${failure}`)}</StatusMessage>;

  // The same answer whether or not the email is on a Registration.
  if (sentTo !== null) {
    return (
      <NoticeCard icon={<MailIcon />} tone="brand" title={t('login.sentTitle')}>
        <p className="text-[15px] wrap-anywhere text-muted-foreground">{t('login.sent', { email: sentTo })}</p>
        {failureMessage}
        {isResent ? <StatusMessage tone="success">{t('login.resent')}</StatusMessage> : null}
        <Button
          type="button"
          variant="link"
          className="min-h-11 self-start"
          disabled={isResending}
          onClick={() => void resend()}
        >
          {t('login.resend')}
        </Button>
      </NoticeCard>
    );
  }

  return (
    <Card>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="email">
          {(field) => <field.TextField label={t('login.email')} type="email" autoComplete="email" />}
        </form.AppField>
        {failureMessage}
        <form.AppForm>
          <form.SubmitButton variant="brand" size="lg" className="w-full">
            {t('login.submit')}
          </form.SubmitButton>
        </form.AppForm>
      </form>
    </Card>
  );
}
