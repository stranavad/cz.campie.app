import { Link, Navigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useLandingPage } from '@/features/camp-pages/components/use-landing-page.hook';

// The Organisation's landing: its Camps as cards, or straight to its only one.
export function LandingPage() {
  const { t } = useTranslation('campPages');
  const page = useLandingPage();

  if (page.isLoading) {
    return null;
  }

  if (page.isError) {
    return <p className="py-12 text-destructive">{t('error')}</p>;
  }

  if (page.onlyCamp !== undefined) {
    return <Navigate to="/organisation/$campSlug" params={{ campSlug: page.onlyCamp.slug }} replace />;
  }

  return (
    <div className="flex flex-col gap-4 py-8">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      {page.camps.length === 0 ? <p className="text-muted-foreground">{t('empty')}</p> : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {page.camps.map((camp) => (
          <li key={camp.id}>
            <Link
              to="/organisation/$campSlug"
              params={{ campSlug: camp.slug }}
              className="flex items-center gap-3 rounded-lg border border-border p-4 hover:border-primary"
            >
              {camp.logoUrl === null ? null : <img src={camp.logoUrl} alt="" className="h-10 w-auto" />}
              <span className="font-medium">{camp.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
