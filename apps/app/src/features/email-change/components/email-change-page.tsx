import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEmailChangePage } from '@/features/email-change/components/use-email-change-page.hook';

interface EmailChangePageProps {
  token: string;
}

// Confirms a new email from the link mailed to it. A button rather than on opening, so a mail client that
// opens links ahead of the reader does not use it up unseen.
export function EmailChangePage({ token }: EmailChangePageProps) {
  const { t } = useTranslation('emailChange');
  const { confirm, isDone, isPending, failure } = useEmailChangePage(token);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col py-4 sm:py-10">
      <Card className="gap-4 rounded-[28px] sm:p-7">
        <h1 className="text-card-title">{t('title')}</h1>
        {isDone ? (
          <>
            <Alert variant="success" className="font-semibold">
              <output className="block">{t('done')}</output>
            </Alert>
            <Link to="/platform" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
              {t('continue')}
            </Link>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">{t('intro')}</p>
            {failure === null ? null : (
              <Alert variant="danger" role="alert">
                {t(`failure.${failure}`)}
              </Alert>
            )}
            <Button size="lg" disabled={isPending || token === ''} onClick={confirm}>
              {t('submit')}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
