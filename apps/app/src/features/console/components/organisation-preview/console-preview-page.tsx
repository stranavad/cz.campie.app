import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { CampPageView } from '@/core/camp-page';
import { useOrganisationPreviewQuery } from '@/features/console/api/console.queries';

interface ConsolePreviewPageProps {
  organisationId: string;
}

// The public pages of an Organisation awaiting approval, for the operator to look at before approving it.
export function ConsolePreviewPage({ organisationId }: ConsolePreviewPageProps) {
  const { t } = useTranslation('console');
  const preview = useOrganisationPreviewQuery(organisationId);

  return (
    <div className="flex flex-col gap-4 py-6">
      <Link to="/platform/konzole" className="text-sm text-muted-foreground underline">
        {t('preview.back')}
      </Link>
      <p className="rounded-lg bg-muted px-3 py-2 text-sm">{t('preview.notice')}</p>
      {preview.isPending && organisationId !== '' ? (
        <p className="py-12 text-muted-foreground">{t('loading')}</p>
      ) : null}
      {preview.isError || organisationId === '' ? <p className="py-12 text-destructive">{t('preview.error')}</p> : null}
      {preview.data?.camps.length === 0 ? <p className="py-12">{t('preview.noCamps')}</p> : null}
      {preview.data?.camps.map(({ camp, turnusy }) => (
        <section key={camp.slug} className="border-t border-border pt-4">
          <CampPageView camp={camp} turnusy={turnusy} />
        </section>
      ))}
    </div>
  );
}
