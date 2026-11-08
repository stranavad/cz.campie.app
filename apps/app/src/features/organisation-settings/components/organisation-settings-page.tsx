import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page-header';
import { SettingsSection } from '@/components/settings-section';
import { Alert } from '@/components/ui/alert';
import { LogoField } from '@/core/branding';
import { BrandingForm } from '@/features/organisation-settings/components/branding-form/branding-form';
import { IdentityForm } from '@/features/organisation-settings/components/identity-form/identity-form';
import { PaymentGatewayForm } from '@/features/organisation-settings/components/payment-gateway-form/payment-gateway-form';
import { SupportAccessSection } from '@/features/organisation-settings/components/support-access-section/support-access-section';
import { TwoStepSection } from '@/features/organisation-settings/components/two-step-section/two-step-section';
import { useOrganisationSettingsPage } from '@/features/organisation-settings/components/use-organisation-settings-page.hook';

// The Owner's settings of the Organisation: legal identity, bank account, contacts, branding and Comgate keys.
export function OrganisationSettingsPage() {
  const { t } = useTranslation('organisationSettings');
  const page = useOrganisationSettingsPage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (page.isNotOwner) {
    return <Alert>{t('notOwner')}</Alert>;
  }

  if (page.isError || page.settings === undefined) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('intro')} />
      <IdentityForm organisationId={page.organisationId} settings={page.settings} />
      <SettingsSection title={t('branding.title')} description={t('branding.intro')}>
        <LogoField
          logo={page.settings.logo}
          emptyText={t('logoNone')}
          setLogo={page.setLogo}
          removeLogo={page.removeLogo}
        />
        <BrandingForm organisationId={page.organisationId} settings={page.settings} />
      </SettingsSection>
      <PaymentGatewayForm organisationId={page.organisationId} />
      <SettingsSection title={t('security.title')} description={t('security.intro')}>
        <TwoStepSection organisationId={page.organisationId} required={page.settings.totpRequired} />
        <hr className="border-border-subtle" />
        <SupportAccessSection organisationId={page.organisationId} />
      </SettingsSection>
    </>
  );
}
