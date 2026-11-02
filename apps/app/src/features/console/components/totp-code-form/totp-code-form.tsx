import { useTranslation } from 'react-i18next';

import {
  useTotpCodeForm,
  type TotpCodePurpose,
} from '@/features/console/components/totp-code-form/use-totp-code-form.hook';

interface TotpCodeFormProps {
  purpose: TotpCodePurpose;
}

export function TotpCodeForm({ purpose }: TotpCodeFormProps) {
  const { t } = useTranslation('console');
  const { form, failure } = useTotpCodeForm(purpose);

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
        {(field) => (
          <field.TextField label={t('totp.code')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
        )}
      </form.AppField>
      {failure === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {t(`totp.failure.${failure}`)}
        </p>
      )}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t(`totp.submit.${purpose}`)}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
