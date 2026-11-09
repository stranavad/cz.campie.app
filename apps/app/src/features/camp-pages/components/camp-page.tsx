import { Link, Navigate } from '@tanstack/react-router';
import { SearchXIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
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
    return <EmptyState className="my-8" icon={<SearchXIcon />} title={t('notFound')} />;
  }

  if (page.isError || page.camp === undefined) {
    return (
      <Alert variant="danger" role="alert" className="my-8">
        {t('error')}
      </Alert>
    );
  }

  return (
    <CampPageView
      camp={page.camp}
      turnusy={page.turnusy}
      actionOf={(turnus) =>
        turnus.availability === 'open' ? (
          <Link
            to="/organisation/$campSlug/prihlaska"
            params={{ campSlug: page.camp?.slug ?? campSlug }}
            search={{ turnus: turnus.id }}
            className={buttonVariants({ variant: 'brand', size: 'lg' })}
          >
            {t('register')}
          </Link>
        ) : null
      }
    />
  );
}
