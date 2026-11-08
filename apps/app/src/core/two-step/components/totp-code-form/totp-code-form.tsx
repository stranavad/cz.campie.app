import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
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
  const { form, failure } = useTotpCodeForm(purpose, onConfirmed);

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
            purpose !== 'verify' ? (
              <field.TextField
                label={t('twoStep.code')}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="font-mono tracking-[0.2em]"
              />
            ) : (
              <field.TextField
                label={t('twoStep.codeOrRecovery')}
                autoComplete="one-time-code"
                autoCapitalize="none"
                maxLength={9}
                className="font-mono tracking-[0.2em]"
              />
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
    </form>
  );
}
