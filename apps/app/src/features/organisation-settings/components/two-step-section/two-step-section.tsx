import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRequireTotpMutation } from '@/features/organisation-settings/api/organisation-settings.queries';
import { FormMessage } from '@/features/organisation-settings/components/form-message';

interface TwoStepSectionProps {
  organisationId: string;
  required: boolean;
}

// Requiring two-step login of every admin of the Organisation; one without it sets it up before anything else.
export function TwoStepSection({ organisationId, required }: TwoStepSectionProps) {
  const { t } = useTranslation('organisationSettings');
  const requireTotp = useRequireTotpMutation(organisationId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="font-bold">{t('twoStep.title')}</h3>
        <Badge variant={required ? 'success' : 'neutral'} dot>
          {t(required ? 'twoStep.required' : 'twoStep.notRequired')}
        </Badge>
      </div>
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
      {requireTotp.isError ? <FormMessage tone="danger">{t('twoStep.failure')}</FormMessage> : null}
    </div>
  );
}
