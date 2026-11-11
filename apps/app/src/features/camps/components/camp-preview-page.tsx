import { Link } from '@tanstack/react-router';
import { ChevronLeftIcon, EyeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertContent } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { LoginRedirect } from '@/core/account';
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
    return <LoginRedirect />;
  }

  if (page.isLoading) {
    return <p className="py-12 text-muted-foreground">{t('loading')}</p>;
  }

  if (page.preview === undefined) {
    return <Alert variant="danger">{t('error')}</Alert>;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link
          to="/platform/tabory"
          search={{ tabor: campId }}
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-2 self-start' })}
        >
          <ChevronLeftIcon aria-hidden="true" />
          {t('preview.back')}
        </Link>
        <Alert variant="brand">
          <EyeIcon aria-hidden="true" />
          <AlertContent>{t('preview.notice')}</AlertContent>
        </Alert>
      </div>
      <div className="overflow-hidden rounded-3xl border border-border bg-background px-4 sm:px-6">
        <CampPageView camp={page.preview.camp} turnusy={page.preview.turnusy} />
      </div>
    </>
  );
}
