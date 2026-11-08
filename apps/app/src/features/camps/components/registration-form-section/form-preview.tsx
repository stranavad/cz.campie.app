import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE, type ShownDeclaration } from '@repo/schema/camps';
import { formFields, type AnswerValue, type FormDefinition } from '@repo/schema/form-engine';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { DeclarationCheckbox, RegistrationField } from '@/core/registration-form';

interface FormPreviewProps {
  definition: FormDefinition;
  declarations: readonly ShownDeclaration[];
}

// The draft as guardians will fill it in, for one child; nothing typed here is kept.
export function FormPreview({ definition, declarations }: FormPreviewProps) {
  const { t } = useTranslation('camps');
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const section = (scope: 'participant' | 'registration') =>
    formFields(definition, REGISTRATION_FIELD_CATALOGUE, scope).map((field) => (
      <RegistrationField
        key={`${scope}-${field.key}`}
        field={field}
        value={answers[`${scope}-${field.key}`]}
        onChange={(value) => setAnswers({ ...answers, [`${scope}-${field.key}`]: value })}
      />
    ));

  return (
    <Card aria-label={t('registrationForm.previewTitle')} className="border-dashed border-input">
      <div className="flex flex-col gap-1">
        <CardTitle>{t('registrationForm.previewTitle')}</CardTitle>
        <CardDescription>{t('registrationForm.previewNote')}</CardDescription>
      </div>
      <div className="flex max-w-xl flex-col gap-5">
        <h3 className="text-lg font-bold">{t('registrationForm.previewChild')}</h3>
        {section('participant')}
        <h3 className="text-lg font-bold">{t('registrationForm.previewGuardian')}</h3>
        {section('registration')}
        {declarations.map((declaration) => (
          <DeclarationCheckbox
            key={declaration.id}
            declaration={declaration}
            checked={ticked.includes(declaration.id)}
            onChange={(checked) =>
              setTicked(checked ? [...ticked, declaration.id] : ticked.filter((id) => id !== declaration.id))
            }
          />
        ))}
      </div>
    </Card>
  );
}
