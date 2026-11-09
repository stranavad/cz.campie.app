import { useTranslation } from 'react-i18next';

import { SettingSwitch } from '@/components/setting-switch';
import { FormMessage } from '@/features/organisation-settings/components/form-message';
import { TwoStepOffDialog } from '@/features/organisation-settings/components/two-step-section/two-step-off-dialog';
import { useTwoStepSection } from '@/features/organisation-settings/components/two-step-section/use-two-step-section.hook';

interface TwoStepSectionProps {
  organisationId: string;
  required: boolean;
}

// Requiring two-step login of every admin of the Organisation, with how many of the team still lack it; one
// without it sets it up before anything else. Switching it off is confirmed first.
export function TwoStepSection({ organisationId, required }: TwoStepSectionProps) {
  const { t } = useTranslation('organisationSettings');
  const section = useTwoStepSection(organisationId);
  const intro = t(required ? 'twoStep.on' : 'twoStep.intro');

  return (
    <div className="flex flex-col gap-3">
      <fieldset disabled={section.isSaving} className="contents">
        <SettingSwitch
          label={t('twoStep.require')}
          description={
            section.withoutTotp === null ? intro : `${intro} ${t('twoStep.without', { count: section.withoutTotp })}`
          }
          checked={required}
          onCheckedChange={section.setRequired}
        />
      </fieldset>
      {section.hasFailed ? <FormMessage tone="danger">{t('twoStep.failure')}</FormMessage> : null}
      <TwoStepOffDialog
        open={section.isConfirmingOff}
        onOpenChange={section.setConfirmingOff}
        isSaving={section.isSaving}
        onConfirm={section.switchOff}
      />
    </div>
  );
}
