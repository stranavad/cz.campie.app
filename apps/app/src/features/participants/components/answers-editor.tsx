import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { formFields, type Answers, type AnswerValue, type FormDefinition } from '@repo/schema/form-engine';
import type { PriceChange } from '@repo/schema/registrations';
import { czk } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { RegistrationField } from '@/core/registration-form';

// Answers to a form's fields of one scope, with a price preview before saving: the changed price lines an
// admin confirms by saving.
export function AnswersEditor({
  definition,
  scope,
  initial,
  onPreview,
  onSave,
  isSaving,
  failed,
}: {
  definition: FormDefinition;
  scope: 'registration' | 'participant';
  initial: Answers;
  onPreview: (answers: Answers) => Promise<PriceChange>;
  onSave: (answers: Answers, expectedLines: PriceChange['lines']) => void;
  isSaving: boolean;
  failed: boolean;
}) {
  const { t } = useTranslation('participants');
  const [answers, setAnswers] = useState<Answers>(initial);
  const [preview, setPreview] = useState<PriceChange | null>(null);
  const fields = formFields(definition, REGISTRATION_FIELD_CATALOGUE, scope).filter(
    (field) => scope === 'participant' || field.tier !== 'core',
  );
  // Only what changed is sent, so the rest stays as it is.
  const changed = Object.fromEntries(
    fields
      .filter(({ key }) => JSON.stringify(answers[key] ?? null) !== JSON.stringify(initial[key] ?? null))
      .map(({ key }) => [key, answers[key] ?? null]),
  );

  return (
    <div className="flex flex-col gap-3">
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
      {preview === null ? null : (
        <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
          <p className="font-medium">{preview.lines.length === 0 ? t('edit.noPriceChange') : t('edit.priceChange')}</p>
          {preview.lines.map((line, index) => (
            <p key={index}>
              {t('edit.line', { label: line.label ?? t(`edit.kinds.${line.kind}`), amount: czk(line.amount) })}
            </p>
          ))}
        </div>
      )}
      {failed ? <p className="text-sm text-destructive">{t('edit.failed')}</p> : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void onPreview(changed).then(setPreview)}>
          {t('edit.preview')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={preview === null || isSaving}
          onClick={() => (preview === null ? undefined : onSave(changed, preview.lines))}
        >
          {t('edit.save')}
        </Button>
      </div>
    </div>
  );
}
