import { useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useAccountQuery, useCurrentMembership, useRequestEmailVerificationMutation } from '@/core/account';
import { HttpError } from '@/lib/api';

// Asks an admin who has not verified their email to do so, on every page until they do: until then
// whoever is invited under that email takes the account over. Not on the page that verifies it, which the
// link in the email opens.
export function EmailVerificationBanner() {
  const { t } = useTranslation();
  const account = useAccountQuery();
  const { membership } = useCurrentMembership();
  const resend = useRequestEmailVerificationMutation();
  const isVerificationPage = useMatchRoute()({ to: '/platform/overeni-emailu' }) !== false;

  if (isVerificationPage || account.data === undefined || account.data.emailVerified || membership === undefined) {
    return null;
  }

  const isThrottled = resend.error instanceof HttpError && resend.error.code === 'requests_throttled';

  return (
    <section className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-warning px-4 py-2.5 text-center text-sm font-medium text-warning-foreground">
      <p>{t('platformShell.emailVerification.notice', { email: account.data.email })}</p>
      {resend.isSuccess ? (
        <output>{t('platformShell.emailVerification.sent')}</output>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={resend.isPending}
          onClick={() => resend.mutate(membership.organisation.id)}
        >
          {t('platformShell.emailVerification.resend')}
        </Button>
      )}
      {resend.isError ? (
        <p role="alert">
          {t(
            isThrottled
              ? 'platformShell.emailVerification.failure.requests_throttled'
              : 'platformShell.emailVerification.failure.unexpected',
          )}
        </p>
      ) : null}
    </section>
  );
}
