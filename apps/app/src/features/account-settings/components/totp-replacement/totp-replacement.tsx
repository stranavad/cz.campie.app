import { ExternalLinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { groupSecret } from '@/core/two-step';
import { useTotpReplacement } from '@/features/account-settings/components/totp-replacement/use-totp-replacement.hook';

// A new phone while two-step login stays on: the old app's code, the new key, then the new app's code.
export function TotpReplacement() {
  const { t } = useTranslation();
  const { form, enrolment, failure, isDone } = useTotpReplacement();

  if (isDone) {
    return (
      <Alert variant="success">
        <output className="block">{t('accountSettings.replacement.done')}</output>
      </Alert>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {enrolment === null ? null : (
        <>
          <p className="text-sm">{t('accountSettings.replacement.secret')}</p>
          <code className="rounded-2xl bg-muted px-4 py-3 font-mono text-base tracking-wider break-all sm:text-lg">
            {groupSecret(enrolment.secret)}
          </code>
          <a href={enrolment.uri} className={buttonVariants({ variant: 'outline', className: 'self-start' })}>
            <ExternalLinkIcon aria-hidden="true" />
            {t('twoStep.enrolment.openApp')}
          </a>
        </>
      )}
      <div className="max-w-xs">
        <form.AppField name="code">
          {(field) => (
            <field.CodeField
              label={t(
                enrolment === null ? 'accountSettings.replacement.oldCode' : 'accountSettings.replacement.newCode',
              )}
            />
          )}
        </form.AppField>
      </div>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`twoStep.failure.${failure}`)}
        </Alert>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">
          {t(enrolment === null ? 'accountSettings.replacement.start' : 'accountSettings.replacement.confirm')}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
