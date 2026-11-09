import { useTranslation } from 'react-i18next';

import type { Answers, FormField } from '@repo/schema/form-engine';

import { useAnswerText, useFieldLabel } from '@/core/registration-form';
import { ReviewCard, type ReviewRow } from '@/features/registration/components/review-card';

interface RegistrationReviewProps {
  registrationFields: readonly FormField[];
  participantFields: readonly FormField[];
  registration: Answers;
  participants: readonly Answers[];
  onEdit: (step: number, child?: number) => void;
}

// The answers of the first three steps read back before sending: the guardians, each child, the
// Registration's own questions; what was left empty is left out.
export function RegistrationReview(props: RegistrationReviewProps) {
  const { t } = useTranslation('registration');
  const labelOf = useFieldLabel();
  const answerText = useAnswerText();
  const rowsOf = (fields: readonly FormField[], answers: Answers): ReviewRow[] =>
    fields.flatMap((field) => {
      const text = answerText(field, answers[field.key]);

      return text === null ? [] : [{ key: field.key, label: labelOf(field), text }];
    });
  const questions = rowsOf(
    props.registrationFields.filter(({ tier }) => tier !== 'core'),
    props.registration,
  );

  return (
    <>
      <ReviewCard
        title={t('steps.guardians.name')}
        rows={rowsOf(
          props.registrationFields.filter(({ tier }) => tier === 'core'),
          props.registration,
        )}
        onEdit={() => props.onEdit(1)}
      />
      {props.participants.map((answers, index) => (
        <ReviewCard
          key={index}
          title={typeof answers.firstName === 'string' ? answers.firstName : t('child', { number: index + 1 })}
          rows={rowsOf(props.participantFields, answers)}
          onEdit={() => props.onEdit(2, index)}
        />
      ))}
      {questions.length === 0 ? null : (
        <ReviewCard title={t('steps.questions.name')} rows={questions} onEdit={() => props.onEdit(3)} />
      )}
    </>
  );
}
