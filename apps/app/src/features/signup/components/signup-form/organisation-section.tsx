import { useTranslation } from 'react-i18next';

import { FieldLegend, FieldSet } from '@/components/ui/field';
import { withForm } from '@/core/form';
import { signupFormOptions } from '@/features/signup/components/signup-form/signup-form.schema';

// The legal identity, as in the business register.
export const OrganisationSection = withForm({
  ...signupFormOptions,
  render: function OrganisationSection({ form }) {
    const { t } = useTranslation('signup');

    return (
      <FieldSet>
        <FieldLegend>{t('organisation.legend')}</FieldLegend>
        <form.AppField name="legalName">
          {(field) => <field.TextField label={t('organisation.legalName')} autoComplete="organization" />}
        </form.AppField>
        <div className="grid items-start gap-4 sm:grid-cols-2 sm:gap-3">
          <form.AppField name="ico">
            {(field) => <field.TextField label={t('organisation.ico')} inputMode="numeric" />}
          </form.AppField>
          <form.AppField name="vatId">
            {(field) => <field.TextField label={t('organisation.vatId')} description={t('organisation.vatIdHint')} />}
          </form.AppField>
        </div>
        <form.AppField name="address">
          {(field) => <field.TextField label={t('organisation.address')} description={t('organisation.addressHint')} />}
        </form.AppField>
        <form.AppField name="statutoryRepresentative">
          {(field) => <field.TextField label={t('organisation.statutoryRepresentative')} />}
        </form.AppField>
      </FieldSet>
    );
  },
});
