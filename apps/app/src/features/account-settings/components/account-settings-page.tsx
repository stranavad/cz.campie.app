import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page-header';
import { SettingsSection } from '@/components/settings-section';
import { Alert } from '@/components/ui/alert';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';
import { useAccountQuery } from '@/core/account';
import { AccountEmailForm } from '@/features/account-settings/components/account-email-form/account-email-form';
import { AccountMemberships } from '@/features/account-settings/components/account-memberships';
import { AccountNameForm } from '@/features/account-settings/components/account-name-form/account-name-form';
import { AccountPasswordForm } from '@/features/account-settings/components/account-password-form/account-password-form';
import { AccountTwoStep } from '@/features/account-settings/components/account-two-step';
import { HttpError } from '@/lib/api';

// The signed-in admin's own account: their name, how they sign in, their two-step login and where they work.
export function AccountSettingsPage() {
  const { t } = useTranslation();
  const account = useAccountQuery();

  if (account.error instanceof HttpError && account.error.status === 401) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (account.isPending) {
    return <p className="text-muted-foreground">{t('accountSettings.loading')}</p>;
  }

  if (account.isError) {
    return <Alert variant="danger">{t('accountSettings.error')}</Alert>;
  }

  return (
    <>
      <PageHeader title={t('accountSettings.title')} />
      <SettingsSection title={t('accountSettings.name')} description={t('accountSettings.nameIntro')}>
        <AccountNameForm firstName={account.data.firstName} lastName={account.data.lastName} />
      </SettingsSection>
      <SettingsSection title={t('accountSettings.credentials')}>
        <DescriptionList>
          <DescriptionItem label={t('accountSettings.email')}>{account.data.email}</DescriptionItem>
        </DescriptionList>
        <hr className="border-border-subtle" />
        <AccountEmailForm />
        <hr className="border-border-subtle" />
        <AccountPasswordForm email={account.data.email} />
      </SettingsSection>
      <AccountTwoStep totp={account.data.totp} />
      <AccountMemberships memberships={account.data.memberships} />
    </>
  );
}
