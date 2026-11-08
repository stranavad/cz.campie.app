import { useTranslation } from 'react-i18next';

import { SettingsSection } from '@/components/settings-section';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TotpCodeForm, TotpEnrolment, useShowRecoveryCodes } from '@/core/two-step';

interface AccountTwoStepProps {
  totpEnabled: boolean;
}

// The admin's own two-step login: its setup while it is off, new recovery codes once it is on.
export function AccountTwoStep({ totpEnabled }: AccountTwoStepProps) {
  const { t } = useTranslation();
  const showRecoveryCodes = useShowRecoveryCodes();

  if (!totpEnabled) {
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
        <p className="text-sm text-muted-foreground">{t('accountSettings.totpOn')}</p>
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
