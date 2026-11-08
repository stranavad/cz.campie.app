import { useTranslation } from 'react-i18next';

import type { OrganisationSettings } from '@repo/schema/organisations';

import { SettingsSection } from '@/components/settings-section';
import { FormMessage } from '@/features/organisation-settings/components/form-message';
import { useIdentityForm } from '@/features/organisation-settings/components/identity-form/use-identity-form.hook';

interface IdentityFormProps {
  organisationId: string;
  settings: OrganisationSettings;
}

// The legal identity and bank account that generated documents and payment instructions carry.
export function IdentityForm({ organisationId, settings }: IdentityFormProps) {
  const { t } = useTranslation('organisationSettings');
  const { form, status } = useIdentityForm(organisationId, settings);

  return (
    <SettingsSection title={t('identity.title')} description={t('identity.intro')}>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <form.AppField name="legalName">
            {(field) => <field.TextField label={t('identity.legalName')} />}
          </form.AppField>
          <form.AppField name="ico">
            {(field) => <field.TextField label={t('identity.ico')} inputMode="numeric" />}
          </form.AppField>
          <form.AppField name="vatId">
            {(field) => <field.TextField label={t('identity.vatId')} description={t('identity.vatIdHint')} />}
          </form.AppField>
          <form.AppField name="address">{(field) => <field.TextField label={t('identity.address')} />}</form.AppField>
          <form.AppField name="statutoryRepresentative">
            {(field) => <field.TextField label={t('identity.statutoryRepresentative')} />}
          </form.AppField>
          <form.AppField name="bankAccount">
            {(field) => (
              <field.TextField
                label={t('identity.bankAccount')}
                description={t('identity.bankAccountHint')}
                placeholder={t('identity.bankAccountSample')}
              />
            )}
          </form.AppField>
          <form.AppField name="contactEmail">
            {(field) => (
              <field.TextField
                label={t('identity.contactEmail')}
                description={t('identity.contactEmailHint')}
                type="email"
              />
            )}
          </form.AppField>
          <form.AppField name="contactPhone">
            {(field) => <field.TextField label={t('identity.contactPhone')} type="tel" />}
          </form.AppField>
          <form.AppField name="billingEmail">
            {(field) => <field.TextField label={t('identity.billingEmail')} type="email" />}
          </form.AppField>
        </div>
        {status === 'saved' ? <FormMessage tone="success">{t('saved')}</FormMessage> : null}
        {status === 'failed' ? <FormMessage tone="danger">{t('failure')}</FormMessage> : null}
        <form.AppForm>
          <form.SubmitButton className="self-start">{t('save')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </SettingsSection>
  );
}
