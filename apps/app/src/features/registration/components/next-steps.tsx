import { useTranslation } from 'react-i18next';

import type { SubmittedRegistration } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { Card, CardTitle } from '@/components/ui/card';

interface NextStepsProps {
  submitted: SubmittedRegistration;
}

// What follows the submission: the payment, the portal, and the rest of the price after a Deposit.
export function NextSteps({ submitted }: NextStepsProps) {
  const { t } = useTranslation('registration');
  const steps = [
    t(submitted.depositTotal === null ? 'submitted.next.payTotal' : 'submitted.next.payDeposit', {
      variableSymbol: submitted.variableSymbol,
    }),
    t('submitted.next.portal'),
    ...(submitted.depositTotal === null
      ? []
      : [t('submitted.next.balance', { amount: czk(submitted.total - submitted.depositTotal) })]),
  ];

  return (
    <Card>
      <CardTitle>{t('submitted.next.title')}</CardTitle>
      <ol className="flex flex-col gap-3">
        {steps.map((text, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {index + 1}
            </span>
            <span className="pt-0.5 text-[15px]">{text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
