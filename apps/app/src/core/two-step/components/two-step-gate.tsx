import { KeyRoundIcon, ShieldCheckIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useAccountQuery } from '@/core/account';
import { GateCard } from '@/core/two-step/components/gate-card';
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
        <GateCard icon={<KeyRoundIcon />}>
          <RecoveryCodes codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />
        </GateCard>
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
      <GateCard icon={<ShieldCheckIcon />}>
        <div className="flex flex-col gap-1">
          <h1 className="text-heading">{t('twoStep.verify.title')}</h1>
          <p className="text-muted-foreground">{t('twoStep.verify.intro')}</p>
        </div>
        <TotpCodeForm purpose="verify" />
      </GateCard>
    );
  }

  // The API refuses an admin without it in each Organisation that requires it, whichever they act in.
  const requiring = account.data.memberships.find(
    ({ organisation, support }) => organisation.totpRequired && support === null,
  );

  if (!account.data.totpEnabled && requiring !== undefined) {
    return (
      <GateCard icon={<ShieldCheckIcon />}>
        <TotpEnrolment intro={t('twoStep.enrolment.required', { organisation: requiring.organisation.displayName })} />
      </GateCard>
    );
  }

  return children;
}
