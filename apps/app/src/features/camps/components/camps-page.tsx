import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { CampBrandingSection } from '@/features/camps/components/camp-branding-section/camp-branding-section';
import { CampForm } from '@/features/camps/components/camp-form/camp-form';
import { CampSwitcher } from '@/features/camps/components/camp-switcher';
import { CreateCampForm } from '@/features/camps/components/create-camp-form/create-camp-form';
import { DiscountCodeSection } from '@/features/camps/components/discount-code-section/discount-code-section';
import { EmailTextsSection } from '@/features/camps/components/email-texts-section/email-texts-section';
import { RegistrationFormSection } from '@/features/camps/components/registration-form-section/registration-form-section';
import { TurnusSection } from '@/features/camps/components/turnus-section/turnus-section';
import { useCampsPage } from '@/features/camps/components/use-camps-page.hook';

interface CampsPageProps {
  campId: string | undefined;
}

// The Camps' settings: identity, slug, contact, module switches and branding, one Camp at a time.
export function CampsPage({ campId }: CampsPageProps) {
  const { t } = useTranslation('camps');
  const page = useCampsPage(campId);

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.hasNoAccess) {
    return <p className="py-12">{t('noAccess')}</p>;
  }

  if (page.isError || page.selected === undefined) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return (
    <div className="flex flex-col gap-10 py-12">
      <header className="flex flex-col gap-2">
        <Link to="/platform" className="text-sm text-muted-foreground underline">
          {t('backHome')}
        </Link>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {page.canWrite ? null : <p className="text-muted-foreground">{t('readOnly')}</p>}
      </header>
      {page.showsSwitcher ? <CampSwitcher camps={page.camps} selectedId={page.selected.id} /> : null}
      {/* Keyed by the Camp, so switching Camps starts their forms afresh. */}
      <CampForm
        key={page.selected.id}
        organisationId={page.organisationId}
        campId={page.selected.id}
        canWrite={page.canWrite}
      />
      <TurnusSection
        key={`turnusy-${page.selected.id}`}
        organisationId={page.organisationId}
        campId={page.selected.id}
        canWrite={page.canWrite}
      />
      <RegistrationFormSection
        key={`form-${page.selected.id}`}
        organisationId={page.organisationId}
        campId={page.selected.id}
        canWrite={page.canWrite}
      />
      <DiscountCodeSection
        key={`codes-${page.selected.id}`}
        organisationId={page.organisationId}
        campId={page.selected.id}
        canWrite={page.canWrite}
      />
      <EmailTextsSection
        key={`emails-${page.selected.id}`}
        organisationId={page.organisationId}
        campId={page.selected.id}
        canWrite={page.canWrite}
      />
      <CampBrandingSection
        key={`branding-${page.selected.id}`}
        organisationId={page.organisationId}
        campId={page.selected.id}
        canWrite={page.canWrite}
      />
      {page.canWrite ? <CreateCampForm organisationId={page.organisationId} /> : null}
    </div>
  );
}
