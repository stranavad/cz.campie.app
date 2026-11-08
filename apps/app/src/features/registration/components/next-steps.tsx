import { useTranslation } from 'react-i18next';

import { Card, CardTitle } from '@/components/ui/card';

const STEPS = ['payment', 'portal'] as const;

// What follows the submission: the payment, then the portal.
export function NextSteps() {
  const { t } = useTranslation('registration');

  return (
    <Card>
      <CardTitle>{t('submitted.next.title')}</CardTitle>
      <ol className="flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {index + 1}
            </span>
            <span className="pt-0.5">{t(`submitted.next.${step}`)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
