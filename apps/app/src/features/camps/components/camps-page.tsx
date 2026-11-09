import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { CampSettingsHeader } from '@/features/camps/components/camp-settings/camp-settings-header';
import { CampSettingsSection } from '@/features/camps/components/camp-settings/camp-settings-section';
import type { CampSettingsSection as Section } from '@/features/camps/components/camp-settings/camp-settings-section.constant';
import { CampSettingsTabs } from '@/features/camps/components/camp-settings/camp-settings-tabs';
import { CreateCampForm } from '@/features/camps/components/create-camp-form/create-camp-form';
import { useCampsPage } from '@/features/camps/components/use-camps-page.hook';

interface CampsPageProps {
  campId: string | undefined;
  section: Section;
}

// The Camps' settings, one Camp at a time, split into tabs: identity and modules, branding, Turnusy, the
// registration form, e-mails, discounts, Consents and documents.
export function CampsPage({ campId, section }: CampsPageProps) {
  const { t } = useTranslation('camps');
  const page = useCampsPage(campId);

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.hasNoAccess) {
    return <Alert>{t('noAccess')}</Alert>;
  }

  if (page.isError || page.selected === undefined) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <CampSettingsHeader
          organisationId={page.organisationId}
          camps={page.camps}
          selected={page.selected}
          section={section}
          canWrite={page.canWrite}
          isCreating={page.isCreating}
          onCreate={page.startCreating}
        />
        <CampSettingsTabs campId={page.selected.id} section={section} />
      </div>
      {page.canWrite && page.isCreating ? (
        <CreateCampForm organisationId={page.organisationId} onClose={page.stopCreating} />
      ) : null}
      {/* Keyed by the Camp, so switching Camps starts its forms afresh. */}
      <CampSettingsSection
        key={page.selected.id}
        section={section}
        organisationId={page.organisationId}
        camp={page.selected}
        canWrite={page.canWrite}
      />
    </>
  );
}
