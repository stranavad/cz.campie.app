import { Trans, useTranslation } from 'react-i18next';

import { TextLink } from '@/components/text-link';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { withForm } from '@/core/form';
import { signupFormOptions } from '@/features/signup/components/signup-form/signup-form.schema';
import { SIGNUP_LINKS } from '@/features/signup/signup.constant';

// The terms and the data processing agreement, each accepted on its own.
export const ConsentSection = withForm({
  ...signupFormOptions,
  render: function ConsentSection({ form }) {
    const { t } = useTranslation('signup');

    return (
      <FieldSet>
        <FieldLegend>{t('consent.legend')}</FieldLegend>
        <form.AppField name="acceptTerms">
          {(field) => (
            <field.CheckboxField
              label={<Trans t={t} i18nKey="consent.terms" components={{ a: <TextLink href={SIGNUP_LINKS.terms} /> }} />}
            />
          )}
        </form.AppField>
        <form.AppField name="acceptDataProcessingAgreement">
          {(field) => (
            <field.CheckboxField
              label={
                <Trans
                  t={t}
                  i18nKey="consent.dataProcessingAgreement"
                  components={{
                    a: <TextLink href={SIGNUP_LINKS.dataProcessingAgreement} />,
                  }}
                />
              }
            />
          )}
        </form.AppField>
      </FieldSet>
    );
  },
});
