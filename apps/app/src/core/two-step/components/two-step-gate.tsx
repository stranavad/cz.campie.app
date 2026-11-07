import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useAccountQuery } from '@/core/account';
import { RecoveryCodes } from '@/core/two-step/components/recovery-codes';
import { TotpCodeForm } from '@/core/two-step/components/totp-code-form/totp-code-form';
import { TotpEnrolment } from '@/core/two-step/components/totp-enrolment/totp-enrolment';
import { RecoveryCodesContext } from '@/core/two-step/recovery-codes.context';

interface TwoStepGateProps {
  children: ReactNode;
}

// Before anything else: the code of this login when the admin has two-step login on, and its setup when
// their Organisation requires it. The API refuses everything else until then.
export function TwoStepGate({ children }: TwoStepGateProps) {
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  return (
    <RecoveryCodesContext value={setRecoveryCodes}>
      {recoveryCodes === null ? (
        <Gated>{children}</Gated>
      ) : (
        <div className="py-12">
          <RecoveryCodes codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />
        </div>
      )}
    </RecoveryCodesContext>
  );
}

function Gated({ children }: TwoStepGateProps) {
  const { t } = useTranslation();
  const account = useAccountQuery();

  if (account.data === undefined) {
    return children;
  }

  if (account.data.totpEnabled && !account.data.secondFactor) {
    return (
      <section className="flex max-w-xl flex-col gap-4 py-12">
        <h1 className="text-2xl font-semibold">{t('twoStep.verify.title')}</h1>
        <p className="text-muted-foreground">{t('twoStep.verify.intro')}</p>
        <TotpCodeForm purpose="verify" />
      </section>
    );
  }

  // The API refuses an admin without it in each Organisation that requires it, whichever they act in.
  const requiring = account.data.memberships.find(
    ({ organisation, support }) => organisation.totpRequired && support === null,
  );

  if (!account.data.totpEnabled && requiring !== undefined) {
    return (
      <div className="py-12">
        <TotpEnrolment intro={t('twoStep.enrolment.required', { organisation: requiring.organisation.displayName })} />
      </div>
    );
  }

  return children;
}
