import { Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { fieldSensitivity, type Answers, type AnswerValue, type FormField } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { RegistrationField } from '@/core/registration-form';
import { HealthPanel } from '@/features/registration/components/health-panel';

interface ParticipantSectionProps {
  index: number;
  fields: readonly FormField[];
  answers: Answers;
  onChange: (key: string, value: AnswerValue) => void;
  onRemove: (() => void) | null;
  messageAt: (path: readonly (string | number)[]) => string | null;
  ageNote: string | null;
}

// One child's answers, the health ones together in their own panel; the age outside the Turnus's limits is
// told at the birth date.
export function ParticipantSection({
  index,
  fields,
  answers,
  onChange,
  onRemove,
  messageAt,
  ageNote,
}: ParticipantSectionProps) {
  const { t } = useTranslation('registration');
  const field = (shown: FormField) => (
    <RegistrationField
      key={shown.key}
      field={shown}
      value={answers[shown.key]}
      onChange={(value) => onChange(shown.key, value)}
      message={messageAt(['participants', index, shown.key])}
      note={shown.key === 'birthDate' ? ageNote : null}
    />
  );
  const health = fields.filter((shown) => fieldSensitivity(shown) === 'health');

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>{t('child', { number: index + 1 })}</CardTitle>
        {onRemove === null ? null : (
          <Button type="button" variant="ghost" onClick={onRemove}>
            <Trash2Icon aria-hidden="true" />
            {t('removeChild')}
          </Button>
        )}
      </CardHeader>
      {fields.filter((shown) => fieldSensitivity(shown) !== 'health').map(field)}
      {health.length === 0 ? null : <HealthPanel>{health.map(field)}</HealthPanel>}
    </Card>
  );
}
