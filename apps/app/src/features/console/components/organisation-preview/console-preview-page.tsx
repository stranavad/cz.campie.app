import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { CampPageView } from '@/core/camp-page';
import { useOrganisationPreviewQuery } from '@/features/console/api/console.queries';

interface ConsolePreviewPageProps {
  organisationId: string;
}

// The public pages of an Organisation awaiting approval, for the operator to look at before approving it.
export function ConsolePreviewPage({ organisationId }: ConsolePreviewPageProps) {
  const { t } = useTranslation('console');
  const preview = useOrganisationPreviewQuery(organisationId);

  const header = (
    <>
      <PageHeader
        eyebrow={
          <Link
            to="/platform/konzole"
            className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            {t('preview.back')}
          </Link>
        }
        title={t('preview.title')}
      />
      <Alert>{t('preview.notice')}</Alert>
    </>
  );

  if (organisationId === '' || preview.isError) {
    return (
      <>
        {header}
        <Alert variant="danger">{t('preview.error')}</Alert>
      </>
    );
  }

  if (preview.data === undefined) {
    return (
      <>
        {header}
        <p className="text-muted-foreground">{t('loading')}</p>
      </>
    );
  }

  return (
    <>
      {header}
      {preview.data.camps.length === 0 ? <p className="text-muted-foreground">{t('preview.noCamps')}</p> : null}
      {preview.data.camps.map(({ camp, turnusy }) => (
        <Card key={camp.slug} className="py-0 sm:py-0">
          <CampPageView camp={camp} turnusy={turnusy} />
        </Card>
      ))}
    </>
  );
}
