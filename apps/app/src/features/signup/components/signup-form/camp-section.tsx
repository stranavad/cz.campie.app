import { useTranslation } from 'react-i18next';

import { FieldLegend, FieldSet } from '@/components/ui/field';
import { withForm } from '@/core/form';
import { signupFormOptions } from '@/features/signup/components/signup-form/signup-form.schema';

// The first Camp and the subdomain its public pages live on.
export const CampSection = withForm({
  ...signupFormOptions,
  render: function CampSection({ form }) {
    const { t } = useTranslation('signup');

    return (
      <FieldSet>
        <FieldLegend>{t('camp.legend')}</FieldLegend>
        <form.AppField name="campName">
          {(field) => <field.TextField label={t('camp.name')} description={t('camp.nameHint')} />}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.subdomain.trim().toLowerCase()}>
          {(subdomain) => (
            <form.AppField name="subdomain">
              {(field) => (
                <field.TextField
                  label={t('camp.subdomain')}
                  description={t('camp.subdomainHint', {
                    subdomain: subdomain === '' ? t('camp.subdomainSample') : subdomain,
                  })}
                  autoCapitalize="none"
                  spellCheck={false}
                />
              )}
            </form.AppField>
          )}
        </form.Subscribe>
      </FieldSet>
    );
  },
});
