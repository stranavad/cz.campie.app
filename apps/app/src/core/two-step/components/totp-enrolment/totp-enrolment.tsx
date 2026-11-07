import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useStartTotpEnrolmentMutation } from '@/core/two-step/api/two-step.queries';
import { TotpCodeForm } from '@/core/two-step/components/totp-code-form/totp-code-form';
import { useShowRecoveryCodes } from '@/core/two-step/recovery-codes.context';

// Groups of four, as authenticator apps print a key, so it is easier to type in.
function groupSecret(secret: string): string {
  return secret.replaceAll(/(.{4})(?=.)/g, '$1 ');
}

interface TotpEnrolmentProps {
  // Why the admin sets it up here: by their own choice, or because the Organisation or the console requires it.
  intro: string;
}

// A new secret for the admin's authenticator app, its first code, then the recovery codes, shown once.
export function TotpEnrolment({ intro }: TotpEnrolmentProps) {
  const { t } = useTranslation();
  const start = useStartTotpEnrolmentMutation();
  const showRecoveryCodes = useShowRecoveryCodes();

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h2 className="text-xl font-semibold">{t('twoStep.enrolment.title')}</h2>
      <p className="text-muted-foreground">{intro}</p>
      {start.data === undefined ? (
        <Button className="self-start" disabled={start.isPending} onClick={() => start.mutate()}>
          {t('twoStep.enrolment.start')}
        </Button>
      ) : (
        <>
          <p>{t('twoStep.enrolment.secret')}</p>
          <code className="self-start rounded bg-muted px-3 py-2 text-lg tracking-wider">
            {groupSecret(start.data.secret)}
          </code>
          <a href={start.data.uri} className="self-start text-sm underline underline-offset-4">
            {t('twoStep.enrolment.openApp')}
          </a>
          <TotpCodeForm purpose="confirm" onConfirmed={showRecoveryCodes} />
        </>
      )}
      {start.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('twoStep.enrolment.failure')}
        </p>
      ) : null}
    </section>
  );
}
