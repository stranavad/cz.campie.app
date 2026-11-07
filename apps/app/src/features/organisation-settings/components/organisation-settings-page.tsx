import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LogoField } from '@/core/branding';
import { BrandingForm } from '@/features/organisation-settings/components/branding-form/branding-form';
import { IdentityForm } from '@/features/organisation-settings/components/identity-form/identity-form';
import { PaymentGatewayForm } from '@/features/organisation-settings/components/payment-gateway-form/payment-gateway-form';
import { useOrganisationSettingsPage } from '@/features/organisation-settings/components/use-organisation-settings-page.hook';

// The Owner's settings of the Organisation: legal identity, bank account, contacts, branding and Comgate keys.
export function OrganisationSettingsPage() {
  const { t } = useTranslation('organisationSettings');
  const page = useOrganisationSettingsPage();

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.isNotOwner) {
    return <p className="py-12">{t('notOwner')}</p>;
  }

  if (page.isError || page.settings === undefined) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return (
    <div className="flex flex-col gap-10 py-12">
      <header className="flex flex-col gap-2">
        <Link to="/platform" className="text-sm text-muted-foreground underline">
          {t('backHome')}
        </Link>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
      </header>
      <IdentityForm organisationId={page.organisationId} settings={page.settings} />
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{t('branding.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('branding.intro')}</p>
        </div>
        <LogoField
          logo={page.settings.logo}
          emptyText={t('logoNone')}
          setLogo={page.setLogo}
          removeLogo={page.removeLogo}
        />
        <BrandingForm organisationId={page.organisationId} settings={page.settings} />
      </section>
      <PaymentGatewayForm organisationId={page.organisationId} />
    </div>
  );
}
