import type { Answers, AnswerValue, FormField } from '@repo/schema/form-engine';

import { Card, CardTitle } from '@/components/ui/card';
import { RegistrationField } from '@/core/registration-form';

interface FormSectionProps {
  title: string;
  fields: FormField[];
  answers: Answers;
  onChange: (answers: Answers) => void;
}

// One part of the paper form typed in: the guardian's, or one child's.
export function FormSection({ title, fields, answers, onChange }: FormSectionProps) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {fields.map((field) => (
          <RegistrationField
            key={field.key}
            field={field}
            value={answers[field.key]}
            onChange={(value: AnswerValue) => onChange({ ...answers, [field.key]: value })}
          />
        ))}
      </div>
    </Card>
  );
}
