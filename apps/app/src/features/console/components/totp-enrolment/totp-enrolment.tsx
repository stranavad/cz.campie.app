import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useStartTotpEnrolmentMutation } from '@/features/console/api/console.queries';
import { TotpCodeForm } from '@/features/console/components/totp-code-form/totp-code-form';

// Groups of four, as authenticator apps print a key, so it is easier to type in.
function groupSecret(secret: string): string {
  return secret.replaceAll(/(.{4})(?=.)/g, '$1 ');
}

// The operator's first login: a new secret for their authenticator app, then its first code.
export function TotpEnrolment() {
  const { t } = useTranslation('console');
  const start = useStartTotpEnrolmentMutation();

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('enrolment.title')}</h1>
      <p className="text-muted-foreground">{t('enrolment.intro')}</p>
      {start.data === undefined ? (
        <Button className="self-start" disabled={start.isPending} onClick={() => start.mutate()}>
          {t('enrolment.start')}
        </Button>
      ) : (
        <>
          <p>{t('enrolment.secret')}</p>
          <code className="self-start rounded bg-muted px-3 py-2 text-lg tracking-wider">
            {groupSecret(start.data.secret)}
          </code>
          <a href={start.data.uri} className="self-start text-sm underline underline-offset-4">
            {t('enrolment.openApp')}
          </a>
          <TotpCodeForm purpose="confirm" />
        </>
      )}
      {start.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('enrolment.failure')}
        </p>
      ) : null}
    </section>
  );
}
