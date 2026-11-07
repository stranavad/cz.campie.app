import { useTranslation } from 'react-i18next';

import { LogoField } from '@/core/branding';
import { CampAccentForm } from '@/features/camps/components/camp-branding-section/camp-accent-form';
import { useCampBrandingSection } from '@/features/camps/components/camp-branding-section/use-camp-branding-section.hook';

interface CampBrandingSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

// A Camp's own logo and colour over its Organisation's.
export function CampBrandingSection({ organisationId, campId, canWrite }: CampBrandingSectionProps) {
  const { t } = useTranslation('camps');
  const { branding, setLogo, removeLogo } = useCampBrandingSection(organisationId, campId);

  return (
    <section className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t('branding.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('branding.intro')}</p>
      </div>
      {branding.isPending ? <p className="text-muted-foreground">{t('loading')}</p> : null}
      {branding.isError ? <p className="text-destructive">{t('error')}</p> : null}
      {branding.isSuccess ? (
        <>
          <LogoField
            logo={branding.data.logo}
            emptyText={t('branding.organisationLogo')}
            disabled={!canWrite}
            setLogo={setLogo}
            removeLogo={removeLogo}
          />
          <CampAccentForm
            organisationId={organisationId}
            campId={campId}
            branding={branding.data}
            canWrite={canWrite}
          />
        </>
      ) : null}
    </section>
  );
}
