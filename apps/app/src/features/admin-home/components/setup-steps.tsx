import { useTranslation } from 'react-i18next';

import { StepProgress } from '@/components/step-progress';
import { Card, CardTitle } from '@/components/ui/card';
import { SetupStepRow } from '@/features/admin-home/components/setup-step-row';
import { useSetupSteps } from '@/features/admin-home/components/use-setup-steps.hook';

interface SetupStepsProps {
  organisationId: string;
  isOwner: boolean;
}

// "První kroky": what a new Organisation still has to set up before its first Registration. Gone once
// every step is done.
export function SetupSteps({ organisationId, isOwner }: SetupStepsProps) {
  const { t } = useTranslation('adminHome');
  const setup = useSetupSteps(organisationId, isOwner);

  if (setup === null || setup.isComplete) {
    return null;
  }

  return (
    <Card className="gap-0 p-2 sm:p-2">
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2">
        <CardTitle>{t('setup.title')}</CardTitle>
        <StepProgress
          current={setup.done}
          total={setup.steps.length}
          label={t('setup.progress', { done: setup.done, total: setup.steps.length })}
        />
      </div>
      <ol className="divide-y divide-border-subtle">
        {setup.steps.map((step) => (
          <SetupStepRow key={step.key} step={step} />
        ))}
      </ol>
    </Card>
  );
}
