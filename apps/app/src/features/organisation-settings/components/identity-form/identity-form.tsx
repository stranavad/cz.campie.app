import { useTranslation } from 'react-i18next';

import type { OrganisationSettings } from '@repo/schema/organisations';

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
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('identity.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('identity.intro')}</p>
      <form
        noValidate
        className="flex max-w-xl flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="legalName">{(field) => <field.TextField label={t('identity.legalName')} />}</form.AppField>
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
          {(field) => <field.TextField label={t('identity.contactEmail')} type="email" />}
        </form.AppField>
        <form.AppField name="contactPhone">
          {(field) => <field.TextField label={t('identity.contactPhone')} type="tel" />}
        </form.AppField>
        <form.AppField name="billingEmail">
          {(field) => <field.TextField label={t('identity.billingEmail')} type="email" />}
        </form.AppField>
        {status === 'saved' ? <output className="block text-sm">{t('saved')}</output> : null}
        {status === 'failed' ? (
          <p role="alert" className="text-sm text-destructive">
            {t('failure')}
          </p>
        ) : null}
        <form.AppForm>
          <form.SubmitButton className="self-start">{t('save')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </section>
  );
}
