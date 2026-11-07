import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useRequireTotpMutation } from '@/features/organisation-settings/api/organisation-settings.queries';

interface TwoStepSectionProps {
  organisationId: string;
  required: boolean;
}

// Requiring two-step login of every admin of the Organisation; one without it sets it up before anything else.
export function TwoStepSection({ organisationId, required }: TwoStepSectionProps) {
  const { t } = useTranslation('organisationSettings');
  const requireTotp = useRequireTotpMutation(organisationId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('twoStep.title')}</h2>
      <p className="text-sm text-muted-foreground">{t(required ? 'twoStep.on' : 'twoStep.intro')}</p>
      <Button
        type="button"
        size="sm"
        variant={required ? 'outline' : 'default'}
        className="self-start"
        disabled={requireTotp.isPending}
        onClick={() => requireTotp.mutate(!required)}
      >
        {t(required ? 'twoStep.stopRequiring' : 'twoStep.require')}
      </Button>
      {requireTotp.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('twoStep.failure')}
        </p>
      ) : null}
    </section>
  );
}
