import { useTranslation } from 'react-i18next';

import type { OrganisationSettings } from '@repo/schema/organisations';

import { SettingsSection } from '@/components/settings-section';
import { BankAccountForm } from '@/features/organisation-settings/components/bank-account-form/bank-account-form';
import { PaymentGatewayForm } from '@/features/organisation-settings/components/payment-gateway-form/payment-gateway-form';

interface PaymentsSectionProps {
  organisationId: string;
  settings: OrganisationSettings;
}

// The account for transfers and QR payments, and the Comgate keys for cards, each saved on its own.
export function PaymentsSection({ organisationId, settings }: PaymentsSectionProps) {
  const { t } = useTranslation('organisationSettings');

  return (
    <SettingsSection title={t('payments.title')} description={t('payments.intro')}>
      <BankAccountForm organisationId={organisationId} settings={settings} />
      <hr className="border-border-subtle" />
      <PaymentGatewayForm organisationId={organisationId} />
    </SettingsSection>
  );
}
