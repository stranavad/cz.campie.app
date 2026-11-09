import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  useTotpCodeForm,
  type TotpCodePurpose,
} from '@/core/two-step/components/totp-code-form/use-totp-code-form.hook';

interface TotpCodeFormProps {
  purpose: TotpCodePurpose;
  // Called with the recovery codes once a new secret is confirmed or new ones are made.
  onConfirmed?: (recoveryCodes: string[]) => void;
}

export function TotpCodeForm({ purpose, onConfirmed }: TotpCodeFormProps) {
  const { t } = useTranslation();
  const { form, failure, recovery, toggleRecovery } = useTotpCodeForm(purpose, onConfirmed);

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="max-w-xs">
        <form.AppField name="code">
          {(field) =>
            recovery ? (
              <field.TextField
                label={t('twoStep.recoveryCode')}
                autoComplete="off"
                autoCapitalize="none"
                maxLength={9}
                className="font-mono tracking-[0.2em]"
              />
            ) : (
              <field.CodeField label={t('twoStep.code')} />
            )
          }
        </form.AppField>
      </div>
      {failure === null ? null : (
        <Alert variant="danger" role="alert">
          {t(`twoStep.failure.${failure}`)}
        </Alert>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t(`twoStep.submit.${purpose}`)}</form.SubmitButton>
      </form.AppForm>
      {purpose === 'verify' ? (
        <Button
          type="button"
          variant="link"
          className="min-h-11 self-start text-sm sm:min-h-9"
          onClick={toggleRecovery}
        >
          {recovery ? t('twoStep.useApp') : t('twoStep.useRecovery')}
        </Button>
      ) : null}
    </form>
  );
}
