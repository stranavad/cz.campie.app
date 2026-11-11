import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Answers, AnswerValue, FormField } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { RegistrationField } from '@/core/registration-form';
import { guardianFields } from '@/features/registration/components/guardian-fields.helper';

interface GuardianSectionProps {
  fields: readonly FormField[];
  answers: Answers;
  onChange: (key: string, value: AnswerValue) => void;
  hasSecondGuardian: boolean;
  onSecondGuardian: (shown: boolean) => void;
  messageAt: (path: readonly (string | number)[]) => string | null;
}

// The guardian and an optional second one: their contact and the guardian's standard fields, asked once per
// Registration.
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
  const { first, second } = guardianFields(fields);

  return (
    <Card>
      <CardTitle>{t('guardian')}</CardTitle>
      {first.map(field)}
      {hasSecondGuardian ? (
        second.map(field)
      ) : (
        <Button type="button" variant="dashed" onClick={() => onSecondGuardian(true)}>
          <PlusIcon aria-hidden="true" />
          {t('addSecondGuardian')}
        </Button>
      )}
    </Card>
  );
}
