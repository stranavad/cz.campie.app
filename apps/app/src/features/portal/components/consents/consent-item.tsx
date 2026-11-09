import { useTranslation } from 'react-i18next';

import type { ConsentAnswerErrorCode, GuardianConsent } from '@repo/schema/consents';

import { Checkbox } from '@/components/ui/checkbox';
import { ChoiceTile } from '@/features/portal/components/consents/choice-tile';

interface ConsentItemProps {
  item: GuardianConsent['version']['items'][number];
  answer: boolean | undefined;
  problem: ConsentAnswerErrorCode | undefined;
  onAnswer: (value: boolean) => void;
}

// One point of a Consent and its answer: agreeing to it, agreeing or not, or only reading it.
export function ConsentItem({ item, answer, problem, onAnswer }: ConsentItemProps) {
  const { t } = useTranslation('portal');
  const problemMessage =
    problem === undefined ? null : (
      <p className="text-sm font-semibold text-danger-foreground">{t(`consents.problems.${problem}`)}</p>
    );

  if (item.kind === 'must_agree') {
    return (
      <li className="flex flex-col gap-2 border-t border-border-subtle py-3">
        <label className="flex cursor-pointer items-start gap-2.5 text-[15px]">
          <Checkbox className="mt-0.5" checked={answer === true} onCheckedChange={(checked) => onAnswer(checked)} />
          <span className="min-w-0 flex-1 whitespace-pre-line">
            {item.text} <span className="text-muted-foreground">{t('consents.required')}</span>
          </span>
        </label>
        {problemMessage}
      </li>
    );
  }

  if (item.kind === 'yes_no') {
    return (
      <li className="border-t border-border-subtle py-3">
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-[15px] font-semibold whitespace-pre-line">{item.text}</legend>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceTile name={item.id} checked={answer === true} onChange={() => onAnswer(true)}>
              {t('consents.yes')}
            </ChoiceTile>
            <ChoiceTile name={item.id} checked={answer === false} onChange={() => onAnswer(false)}>
              {t('consents.no')}
            </ChoiceTile>
          </div>
          {problemMessage}
        </fieldset>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 border-t border-border-subtle py-3 text-[15px] whitespace-pre-line">
      {item.text}
      {problemMessage}
    </li>
  );
}
