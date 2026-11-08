import { useTranslation } from 'react-i18next';

import type { ConsentAnswerErrorCode, GuardianConsent } from '@repo/schema/consents';

import { Checkbox } from '@/components/ui/checkbox';
import { ChoiceTile } from '@/features/portal/components/consents/choice-tile';

interface ConsentItemProps {
  item: GuardianConsent['version']['items'][number];
  number: number;
  answer: boolean | undefined;
  problem: ConsentAnswerErrorCode | undefined;
  onAnswer: (value: boolean) => void;
}

// One numbered point of a Consent and its answer: agreeing, yes or no, or nothing to answer.
export function ConsentItem({ item, number, answer, problem, onAnswer }: ConsentItemProps) {
  const { t } = useTranslation('portal');

  return (
    <li className="flex flex-col gap-2.5 border-t border-border-subtle py-3.5">
      <p className="flex gap-2 text-[15px] whitespace-pre-line">
        <span className="font-bold tabular-nums">{t('consents.itemNumber', { number })}</span>
        <span className="min-w-0 flex-1">{item.text}</span>
      </p>
      {item.kind === 'must_agree' ? (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-input px-3.5 has-data-checked:border-foreground has-data-checked:bg-brand-soft">
          <Checkbox checked={answer === true} onCheckedChange={(checked) => onAnswer(checked)} />
          <span className="font-semibold">{t('consents.agree')}</span>
        </label>
      ) : null}
      {item.kind === 'yes_no' ? (
        <div className="grid grid-cols-2 gap-2">
          <ChoiceTile name={item.id} checked={answer === true} onChange={() => onAnswer(true)}>
            {t('consents.yes')}
          </ChoiceTile>
          <ChoiceTile name={item.id} checked={answer === false} onChange={() => onAnswer(false)}>
            {t('consents.no')}
          </ChoiceTile>
        </div>
      ) : null}
      {problem === undefined ? null : (
        <p className="text-sm font-semibold text-danger-foreground">{t(`consents.problems.${problem}`)}</p>
      )}
    </li>
  );
}
