import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { AnswerValue, FormField } from '@repo/schema/form-engine';

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ChoiceField } from '@/core/registration-form/components/choice-field';
import { useFieldLabel } from '@/core/registration-form/hooks/use-field-label.hook';

export interface RegistrationFieldProps {
  field: FormField;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  // What is wrong with the answer, already worded; shown under the field.
  message?: string | null;
  // More about the answer that is not an error, such as an age outside the Turnus's limits.
  note?: string | null;
}

const CORE_INPUTS: Partial<Record<string, string>> = {
  birthDate: 'date',
  guardianEmail: 'email',
  guardianPhone: 'tel',
  secondGuardianEmail: 'email',
  secondGuardianPhone: 'tel',
};

// One field of the registration form, as guardians fill it in, with what is wrong with it; the builder's
// preview shows the same.
export function RegistrationField({ message = null, note = null, ...props }: RegistrationFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldInput {...props} />
      {note === null ? null : <p className="text-sm text-muted-foreground">{note}</p>}
      {message === null ? null : (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange }: Omit<RegistrationFieldProps, 'message' | 'note'>) {
  const { t } = useTranslation();
  const label = useFieldLabel()(field);
  const id = useId();
  const text = typeof value === 'string' ? value : '';
  const hint = field.tier === 'custom' ? field.field.hint : null;
  const caption = field.required ? label : t('form.optional', { label });

  if (field.tier !== 'custom') {
    return (
      <Field>
        <FieldLabel htmlFor={id}>{caption}</FieldLabel>
        <Input
          id={id}
          type={CORE_INPUTS[field.key] ?? 'text'}
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
    );
  }

  const custom = field.field;

  switch (custom.type) {
    case 'long_text':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{caption}</FieldLabel>
          <textarea
            id={id}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base md:text-sm"
            value={text}
            onChange={(event) => onChange(event.target.value)}
          />
          {hint === null ? null : <FieldDescription>{hint}</FieldDescription>}
        </Field>
      );
    case 'single_choice':
    case 'multiple_choice':
    case 'yes_no':
      return <ChoiceField field={field} caption={caption} value={value} onChange={onChange} />;
    case 'short_text':
    case 'number':
    case 'date':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{caption}</FieldLabel>
          <Input
            id={id}
            type={custom.type === 'number' ? 'number' : custom.type === 'date' ? 'date' : 'text'}
            value={typeof value === 'number' ? String(value) : text}
            onChange={(event) =>
              onChange(
                custom.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value,
              )
            }
          />
          {hint === null ? null : <FieldDescription>{hint}</FieldDescription>}
        </Field>
      );
  }
}
