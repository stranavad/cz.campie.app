import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { CampPageView } from '@/core/camp-page';
import { useCampPreviewPage } from '@/features/camps/components/use-camp-preview-page.hook';

interface CampPreviewPageProps {
  campId: string;
}

// A Camp's public page as guardians will see it, for its admins, also before the Organisation goes live.
export function CampPreviewPage({ campId }: CampPreviewPageProps) {
  const { t } = useTranslation('camps');
  const page = useCampPreviewPage(campId);

  if (page.isSignedOut) {
    return <Navigate to="/platform/prihlaseni" replace />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.preview === undefined) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return (
    <div className="flex flex-col gap-2 py-6">
      <Link to="/platform/tabory" search={{ tabor: campId }} className="text-sm text-muted-foreground underline">
        {t('preview.back')}
      </Link>
      <p className="rounded-lg bg-muted px-3 py-2 text-sm">{t('preview.notice')}</p>
      <CampPageView camp={page.preview.camp} turnusy={page.preview.turnusy} />
    </div>
  );
}
