import { useTranslation } from 'react-i18next';

import type { Account } from '@repo/schema/admins';

import { SettingsSection } from '@/components/settings-section';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TotpCodeForm, TotpEnrolment } from '@/core/two-step';
import { TotpReplacement } from '@/features/account-settings/components/totp-replacement/totp-replacement';
import { useAccountTwoStep } from '@/features/account-settings/components/use-account-two-step.hook';

interface AccountTwoStepProps {
  totp: Account['totp'];
}

// The admin's own two-step login: its setup while it is off; once on, since when, the recovery codes left,
// a move to a new phone and new recovery codes.
export function AccountTwoStep({ totp }: AccountTwoStepProps) {
  const { t } = useTranslation();
  const { showRecoveryCodes, enabledOn } = useAccountTwoStep(totp);

  if (totp === null || enabledOn === null) {
    return (
      <Card>
        <TotpEnrolment intro={t('twoStep.enrolment.voluntary')} />
      </Card>
    );
  }

  return (
    <SettingsSection title={t('accountSettings.totpTitle')} description={t('accountSettings.totpIntro')}>
      <div className="flex flex-col gap-3">
        <Badge variant="success" dot className="self-start">
          {t('accountSettings.totpStatusOn')}
        </Badge>
        <ul className="flex flex-col gap-1 text-sm">
          <li>{t('accountSettings.totpSince', { date: enabledOn })}</li>
          <li>
            {t('accountSettings.recoveryCodesLeft', { left: totp.recoveryCodesLeft, count: totp.recoveryCodesIssued })}
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">{t('accountSettings.totpOn')}</p>
      </div>
      <hr className="border-border-subtle" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold">{t('accountSettings.replacement.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('accountSettings.replacement.intro')}</p>
        </div>
        <TotpReplacement />
      </div>
      <hr className="border-border-subtle" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold">{t('accountSettings.newRecoveryCodes')}</h3>
          <p className="text-sm text-muted-foreground">{t('accountSettings.newRecoveryCodesIntro')}</p>
        </div>
        <TotpCodeForm purpose="regenerate" onConfirmed={showRecoveryCodes} />
      </div>
    </SettingsSection>
  );
}
