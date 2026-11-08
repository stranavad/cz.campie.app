import { useTranslation } from 'react-i18next';

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
      className="flex max-w-xs flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="code">
        {(field) =>
          purpose !== 'verify' ? (
            <field.TextField label={t('twoStep.code')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
          ) : (
            <field.TextField
              label={t('twoStep.codeOrRecovery')}
              autoComplete="one-time-code"
              autoCapitalize="none"
              maxLength={9}
            />
          )
        }
      </form.AppField>
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`twoStep.failure.${failure}`)}
        </p>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t(`twoStep.submit.${purpose}`)}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
