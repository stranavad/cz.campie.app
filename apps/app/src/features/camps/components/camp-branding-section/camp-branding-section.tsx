import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { LogoField } from '@/core/branding';
import { CampAccentForm } from '@/features/camps/components/camp-branding-section/camp-accent-form';
import { useCampBrandingSection } from '@/features/camps/components/camp-branding-section/use-camp-branding-section.hook';

interface CampBrandingSectionProps {
  organisationId: string;
  campId: string;
  campName: string;
  canWrite: boolean;
}

// A Camp's own logo and colour over its Organisation's.
export function CampBrandingSection({ organisationId, campId, campName, canWrite }: CampBrandingSectionProps) {
  const { t } = useTranslation('camps');
  const { branding, turnusy, setLogo, removeLogo } = useCampBrandingSection(organisationId, campId);

  if (branding.isPending) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  if (branding.isError) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <CampAccentForm
      organisationId={organisationId}
      campId={campId}
      campName={campName}
      branding={branding.data}
      canWrite={canWrite}
      turnusy={turnusy}
      logo={
        <Card>
          <LogoField
            logo={branding.data.logo}
            emptyText={t('branding.organisationLogo')}
            disabled={!canWrite}
            titleAs="card"
            setLogo={setLogo}
            removeLogo={removeLogo}
          />
        </Card>
      }
    />
  );
}
