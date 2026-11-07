import { useTranslation } from 'react-i18next';

import { SECOND_GUARDIAN_FIELDS, type Answers, type AnswerValue, type FormField } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { RegistrationField } from '@/core/registration-form';

interface GuardianSectionProps {
  fields: readonly FormField[];
  answers: Answers;
  onChange: (key: string, value: AnswerValue) => void;
  hasSecondGuardian: boolean;
  onSecondGuardian: (shown: boolean) => void;
  messageAt: (path: readonly (string | number)[]) => string | null;
}

const isSecondGuardian = (key: string) => (SECOND_GUARDIAN_FIELDS as readonly string[]).includes(key);

// What is asked once per Registration: the guardian, an optional second one, and the Registration's own
// questions.
export function GuardianSection({
  fields,
  answers,
  onChange,
  hasSecondGuardian,
  onSecondGuardian,
  messageAt,
}: GuardianSectionProps) {
  const { t } = useTranslation('registration');
  const field = (shown: FormField) => (
    <RegistrationField
      key={shown.key}
      field={shown}
      value={answers[shown.key]}
      onChange={(value) => onChange(shown.key, value)}
      message={messageAt(['registration', shown.key])}
    />
  );

  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <legend className="px-1 font-medium">{t('guardian')}</legend>
      {fields.filter(({ key, tier }) => tier === 'core' && !isSecondGuardian(key)).map(field)}
      {hasSecondGuardian ? (
        fields.filter(({ key }) => isSecondGuardian(key)).map(field)
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onSecondGuardian(true)}>
          {t('addSecondGuardian')}
        </Button>
      )}
      {fields.filter(({ tier }) => tier !== 'core').map(field)}
    </fieldset>
  );
}
