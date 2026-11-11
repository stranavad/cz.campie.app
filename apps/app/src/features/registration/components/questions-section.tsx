import { useTranslation } from 'react-i18next';

import { isGuardianFieldKey } from '@repo/schema/camps';
import type { Answers, AnswerValue, FormField } from '@repo/schema/form-engine';

import { Card } from '@/components/ui/card';
import { RegistrationField } from '@/core/registration-form';

interface QuestionsSectionProps {
  fields: readonly FormField[];
  answers: Answers;
  onChange: (key: string, value: AnswerValue) => void;
  messageAt: (path: readonly (string | number)[]) => string | null;
}

// The Registration's own questions beyond the guardians, asked once for all the children; a form without any
// says so.
export function QuestionsSection({ fields, answers, onChange, messageAt }: QuestionsSectionProps) {
  const { t } = useTranslation('registration');
  const questions = fields.filter(({ key }) => !isGuardianFieldKey(key));

  if (questions.length === 0) {
    return <p className="px-1 text-muted-foreground">{t('steps.questions.none')}</p>;
  }

  return (
    <Card>
      {questions.map((shown) => (
        <RegistrationField
          key={shown.key}
          field={shown}
          value={answers[shown.key]}
          onChange={(value) => onChange(shown.key, value)}
          message={messageAt(['registration', shown.key])}
        />
      ))}
    </Card>
  );
}
