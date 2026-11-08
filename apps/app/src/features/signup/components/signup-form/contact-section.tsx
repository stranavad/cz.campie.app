import { useTranslation } from 'react-i18next';

import { FieldLegend, FieldSet } from '@/components/ui/field';
import { withForm } from '@/core/form';
import { signupFormOptions } from '@/features/signup/components/signup-form/signup-form.schema';

// Where the Platform operator reaches the Organisation, and where its invoices go.
export const ContactSection = withForm({
  ...signupFormOptions,
  render: function ContactSection({ form }) {
    const { t } = useTranslation('signup');

    return (
      <FieldSet>
        <FieldLegend>{t('contact.legend')}</FieldLegend>
        <div className="grid items-start gap-4 sm:grid-cols-2 sm:gap-3">
          <form.AppField name="contactEmail">
            {(field) => <field.TextField label={t('contact.email')} type="email" autoComplete="email" />}
          </form.AppField>
          <form.AppField name="contactPhone">
            {(field) => <field.TextField label={t('contact.phone')} type="tel" autoComplete="tel" />}
          </form.AppField>
        </div>
        <form.AppField name="billingEmail">
          {(field) => (
            <field.TextField
              label={t('contact.billingEmail')}
              description={t('contact.billingEmailHint')}
              type="email"
            />
          )}
        </form.AppField>
      </FieldSet>
    );
  },
});
