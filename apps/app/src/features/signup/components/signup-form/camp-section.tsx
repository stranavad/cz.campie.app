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
        <form.AppField name="subdomain">
          {(field) => (
            <field.TextField
              label={t('camp.subdomain')}
              suffix={t('camp.subdomainSuffix')}
              description={t('camp.subdomainHint')}
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </form.AppField>
      </FieldSet>
    );
  },
});
