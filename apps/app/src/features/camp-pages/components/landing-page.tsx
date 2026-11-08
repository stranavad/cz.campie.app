import { Navigate } from '@tanstack/react-router';
import { TentIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { CampCard } from '@/features/camp-pages/components/camp-card';
import { useLandingPage } from '@/features/camp-pages/components/use-landing-page.hook';

// The Organisation's landing: its Camps as cards, or straight to its only one.
export function LandingPage() {
  const { t } = useTranslation('campPages');
  const page = useLandingPage();

  if (page.isLoading) {
    return null;
  }

  if (page.isError) {
    return (
      <Alert variant="danger" role="alert" className="my-8">
        {t('error')}
      </Alert>
    );
  }

  if (page.onlyCamp !== undefined) {
    return <Navigate to="/organisation/$campSlug" params={{ campSlug: page.onlyCamp.slug }} replace />;
  }

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8">
      <section className="flex flex-col gap-2 px-1">
        <h1 className="text-title">{page.organisation?.displayName ?? t('title')}</h1>
        <p className="text-muted-foreground">{t('lead')}</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-heading px-1">{t('title')}</h2>
        {page.camps.length === 0 ? <EmptyState icon={<TentIcon />} title={t('empty')} /> : null}
        <ul className="grid gap-3.5 sm:grid-cols-2">
          {page.camps.map((camp) => (
            <CampCard key={camp.id} camp={camp} />
          ))}
        </ul>
      </section>
    </div>
  );
}
