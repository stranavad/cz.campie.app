import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVerifyEmailMutation } from '@/features/email-verification/api/email-verification.queries';
import { HttpError } from '@/lib/api';

interface EmailVerificationPageProps {
  token: string;
}

// Confirms the email from the link without a password, since the link proves it. A button rather than on
// opening, so a mail client that opens links ahead of the reader does not use it up unseen.
export function EmailVerificationPage({ token }: EmailVerificationPageProps) {
  const { t } = useTranslation('emailVerification');
  const verify = useVerifyEmailMutation();
  const isLinkInvalid = verify.error instanceof HttpError && verify.error.code === 'email_verification_invalid';

  return (
    <div className="mx-auto flex w-full max-w-md flex-col py-4 sm:py-10">
      <Card className="gap-4 rounded-[28px] sm:p-7">
        <h1 className="text-card-title">{t('title')}</h1>
        {verify.isSuccess ? (
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
            {verify.isError ? (
              <Alert variant="danger" role="alert">
                {t(isLinkInvalid ? 'failure.email_verification_invalid' : 'failure.unexpected')}
              </Alert>
            ) : null}
            <Button size="lg" disabled={verify.isPending || token === ''} onClick={() => verify.mutate({ token })}>
              {t('submit')}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
