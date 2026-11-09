import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SECOND_GUARDIAN_FIELDS, type Answers, type AnswerValue, type FormField } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
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

// The guardian and an optional second one: the core fields asked once per Registration.
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
  const core = fields.filter(({ tier }) => tier === 'core');

  return (
    <Card>
      <CardTitle>{t('guardian')}</CardTitle>
      {core.filter(({ key }) => !isSecondGuardian(key)).map(field)}
      {hasSecondGuardian ? (
        core.filter(({ key }) => isSecondGuardian(key)).map(field)
      ) : (
        <Button type="button" variant="dashed" onClick={() => onSecondGuardian(true)}>
          <PlusIcon aria-hidden="true" />
          {t('addSecondGuardian')}
        </Button>
      )}
    </Card>
  );
}
