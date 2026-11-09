import { useTranslation } from 'react-i18next';

import type { OrganisationSettings } from '@repo/schema/organisations';

import { useBankAccountForm } from '@/features/organisation-settings/components/bank-account-form/use-bank-account-form.hook';
import { FormMessage } from '@/features/organisation-settings/components/form-message';

interface BankAccountFormProps {
  organisationId: string;
  settings: OrganisationSettings;
}

// The account guardians pay to by transfer and QR code; the variable symbol comes with each Registration.
export function BankAccountForm({ organisationId, settings }: BankAccountFormProps) {
  const { t } = useTranslation('organisationSettings');
  const { form, status } = useBankAccountForm(organisationId, settings);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <form.AppField name="bankAccount">
          {(field) => (
            <field.TextField
              label={t('payments.bankAccount')}
              description={t('payments.bankAccountHint')}
              placeholder={t('payments.bankAccountSample')}
            />
          )}
        </form.AppField>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t('payments.variableSymbol')}</span>
          <span className="flex min-h-12 items-center rounded-2xl bg-muted px-3.5 sm:min-h-11">
            {t('payments.variableSymbolValue')}
          </span>
          <span className="text-[13px] text-muted-foreground">{t('payments.variableSymbolHint')}</span>
        </div>
      </div>
      {status === 'saved' ? <FormMessage tone="success">{t('saved')}</FormMessage> : null}
      {status === 'failed' ? <FormMessage tone="danger">{t('failure')}</FormMessage> : null}
      <form.AppForm>
        <form.SubmitButton className="self-start">{t('payments.saveBankAccount')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
