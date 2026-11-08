import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import {
  fieldSensitivity,
  formFields,
  type Answers,
  type AnswerValue,
  type FormDefinition,
} from '@repo/schema/form-engine';
import type { PriceChange } from '@repo/schema/registrations';

import { Button } from '@/components/ui/button';
import { RegistrationField } from '@/core/registration-form';
import { PriceChangePreview } from '@/features/participants/components/editing/price-change-preview';

interface AnswersEditorProps {
  definition: FormDefinition;
  scope: 'registration' | 'participant';
  initial: Answers;
  // Whether health data may be answered here, which takes Health write.
  withHealth: boolean;
  onPreview: (answers: Answers) => Promise<PriceChange>;
  onSave: (answers: Answers, expectedLines: PriceChange['lines']) => void;
  isSaving: boolean;
  failed: boolean;
}

// Answers to a form's fields of one scope, with a price preview before saving: the changed price lines an
// admin confirms by saving.
export function AnswersEditor(props: AnswersEditorProps) {
  const { t } = useTranslation('participants');
  const [answers, setAnswers] = useState<Answers>(props.initial);
  const [preview, setPreview] = useState<PriceChange | null>(null);
  const fields = formFields(props.definition, REGISTRATION_FIELD_CATALOGUE, props.scope)
    .filter((field) => props.withHealth || fieldSensitivity(field) !== 'health')
    .filter((field) => props.scope === 'participant' || field.tier !== 'core');
  // Only what changed is sent, so the rest stays as it is.
  const changed = Object.fromEntries(
    fields
      .filter(({ key }) => JSON.stringify(answers[key] ?? null) !== JSON.stringify(props.initial[key] ?? null))
      .map(({ key }) => [key, answers[key] ?? null]),
  );

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <RegistrationField
          key={field.key}
          field={field}
          value={answers[field.key]}
          onChange={(value: AnswerValue) => {
            setAnswers({ ...answers, [field.key]: value });
            setPreview(null);
          }}
        />
      ))}
      {preview === null ? null : <PriceChangePreview change={preview} />}
      {props.failed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('edit.failed')}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void props.onPreview(changed).then(setPreview)}
        >
          {t('edit.preview')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={preview === null || props.isSaving}
          onClick={() => (preview === null ? undefined : props.onSave(changed, preview.lines))}
        >
          {t('edit.save')}
        </Button>
      </div>
    </div>
  );
}
