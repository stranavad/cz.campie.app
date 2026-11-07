import { useTranslation } from 'react-i18next';

import type { Answers, AnswerValue, FormField } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { RegistrationField } from '@/core/registration-form';

interface ParticipantSectionProps {
  index: number;
  fields: readonly FormField[];
  answers: Answers;
  onChange: (key: string, value: AnswerValue) => void;
  onRemove: (() => void) | null;
  messageAt: (path: readonly (string | number)[]) => string | null;
  ageNote: string | null;
}

// One child's answers; the age outside the Turnus's limits is told at the birth date.
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

  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <legend className="px-1 font-medium">{t('child', { number: index + 1 })}</legend>
      {fields.map((field) => (
        <RegistrationField
          key={field.key}
          field={field}
          value={answers[field.key]}
          onChange={(value) => onChange(field.key, value)}
          message={messageAt(['participants', index, field.key])}
          note={field.key === 'birthDate' ? ageNote : null}
        />
      ))}
      {onRemove === null ? null : (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={onRemove}>
          {t('removeChild')}
        </Button>
      )}
    </fieldset>
  );
}
