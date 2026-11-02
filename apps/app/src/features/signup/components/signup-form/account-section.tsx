import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@repo/schema/shared';

import { FieldLegend, FieldSet } from '@/components/ui/field';
import { withForm } from '@/core/form';
import { signupFormOptions } from '@/features/signup/components/signup-form/signup-form.schema';

// The first Owner's sign-in.
export const AccountSection = withForm({
  ...signupFormOptions,
  render: function AccountSection({ form }) {
    const { t } = useTranslation('signup');

    return (
      <FieldSet>
        <FieldLegend>{t('account.legend')}</FieldLegend>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label={t('account.email')}
              description={t('account.emailHint')}
              type="email"
              autoComplete="email"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={t('account.password')}
              description={t('account.passwordHint', { count: PASSWORD_MIN_LENGTH })}
              type="password"
              autoComplete="new-password"
            />
          )}
        </form.AppField>
      </FieldSet>
    );
  },
});
