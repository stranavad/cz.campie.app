import { ExternalLinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { useStartTotpEnrolmentMutation } from '@/core/two-step/api/two-step.queries';
import { TotpCodeForm } from '@/core/two-step/components/totp-code-form/totp-code-form';
import { groupSecret } from '@/core/two-step/helpers/group-secret.helper';
import { useShowRecoveryCodes } from '@/core/two-step/recovery-codes.context';

interface TotpEnrolmentProps {
  // Why the admin sets it up here: by their own choice, or because the Organisation or the console requires it.
  intro: string;
}

// A new secret for the admin's authenticator app, its first code, then the recovery codes, shown once.
// No card of its own: the caller places it (the gate's card, a settings card, the console).
export function TotpEnrolment({ intro }: TotpEnrolmentProps) {
  const { t } = useTranslation();
  const start = useStartTotpEnrolmentMutation();
  const showRecoveryCodes = useShowRecoveryCodes();

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading">{t('twoStep.enrolment.title')}</h2>
        <p className="text-muted-foreground">{intro}</p>
      </div>
      {start.data === undefined ? (
        <Button className="self-start" disabled={start.isPending} onClick={() => start.mutate()}>
          {t('twoStep.enrolment.start')}
        </Button>
      ) : (
        <>
          <p className="text-sm">{t('twoStep.enrolment.secret')}</p>
          <code className="rounded-2xl bg-muted px-4 py-3 font-mono text-base tracking-wider break-all sm:text-lg">
            {groupSecret(start.data.secret)}
          </code>
          <a href={start.data.uri} className={buttonVariants({ variant: 'outline', className: 'self-start' })}>
            <ExternalLinkIcon aria-hidden="true" />
            {t('twoStep.enrolment.openApp')}
          </a>
          <TotpCodeForm purpose="confirm" onConfirmed={showRecoveryCodes} />
        </>
      )}
      {start.isError ? (
        <Alert variant="danger" role="alert">
          {t('twoStep.enrolment.failure')}
        </Alert>
      ) : null}
    </section>
  );
}
