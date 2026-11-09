import { useTranslation } from 'react-i18next';

import type { Answers, AnswerValue, FormField } from '@repo/schema/form-engine';

import { Card, CardTitle } from '@/components/ui/card';
import { RegistrationField } from '@/core/registration-form';

interface CampQuestionsProps {
  // The Camp's own questions, once per Registration and once per child.
  registrationFields: FormField[];
  childFields: FormField[];
  registration: Answers;
  onRegistration: (answers: Answers) => void;
  childAnswers: Answers[];
  onChild: (index: number, answers: Answers) => void;
}

// The Camp's own questions in one place: the Registration's, then each child's, named when there are several.
export function CampQuestions(props: CampQuestionsProps) {
  const { t } = useTranslation('participants');

  if (props.registrationFields.length === 0 && props.childFields.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('create.questions')}</CardTitle>
      {props.registrationFields.length === 0 ? null : (
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {props.registrationFields.map((field) => (
            <RegistrationField
              key={field.key}
              field={field}
              value={props.registration[field.key]}
              onChange={(value: AnswerValue) => props.onRegistration({ ...props.registration, [field.key]: value })}
            />
          ))}
        </div>
      )}
      {props.childFields.length === 0
        ? null
        : props.childAnswers.map((answers, index) => (
            <div key={index} className="flex flex-col gap-4">
              {props.childAnswers.length > 1 ? (
                <h3 className="border-t border-border-subtle pt-4 font-semibold">
                  {t('create.child', { number: index + 1 })}
                </h3>
              ) : null}
              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                {props.childFields.map((field) => (
                  <RegistrationField
                    key={field.key}
                    field={field}
                    value={answers[field.key]}
                    onChange={(value: AnswerValue) => props.onChild(index, { ...answers, [field.key]: value })}
                  />
                ))}
              </div>
            </div>
          ))}
    </Card>
  );
}
