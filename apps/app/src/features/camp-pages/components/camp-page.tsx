import { Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { CampPageView } from '@/core/camp-page';
import { useCampPage } from '@/features/camp-pages/components/use-camp-page.hook';

interface CampPageProps {
  campSlug: string;
}

export function CampPage({ campSlug }: CampPageProps) {
  const { t } = useTranslation('campPages');
  const page = useCampPage(campSlug);

  if (page.currentSlug !== null) {
    return <Navigate to="/organisation/$campSlug" params={{ campSlug: page.currentSlug }} replace />;
  }

  if (page.isLoading) {
    return null;
  }

  if (page.isNotFound) {
    return <p className="py-12">{t('notFound')}</p>;
  }

  if (page.isError || page.camp === undefined) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  return <CampPageView camp={page.camp} turnusy={page.turnusy} />;
}
