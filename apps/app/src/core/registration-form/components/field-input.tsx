import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { pragueDateOf } from '@repo/schema/shared';

import { DatePicker } from '@/components/date-picker/date-picker';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChoiceField } from '@/core/registration-form/components/choice-field';
import type { RegistrationFieldProps } from '@/core/registration-form/components/registration-field';
import { StandardInput } from '@/core/registration-form/components/standard-input';
import { useFieldLabel } from '@/core/registration-form/hooks/use-field-label.hook';

export interface FieldInputProps extends Omit<RegistrationFieldProps, 'message' | 'note'> {
  invalid: boolean;
  // The message under the field, read out with it.
  describedBy: string | undefined;
}

const CORE_INPUTS: Partial<Record<string, string>> = {
  guardianEmail: 'email',
  guardianPhone: 'tel',
  secondGuardianEmail: 'email',
  secondGuardianPhone: 'tel',
};

// A field's label and input as its tier and type say it is filled in.
export function FieldInput({ field, value, onChange, invalid, describedBy }: FieldInputProps) {
  const { t } = useTranslation();
  const label = useFieldLabel()(field);
  const id = useId();
  // A birth date lies in the past: today in Prague, read once.
  const [today] = useState(() => pragueDateOf(new Date()));
  const text = typeof value === 'string' ? value : '';
  const hint = field.tier === 'custom' ? field.field.hint : null;
  const caption = field.required ? label : t('form.optional', { label });
  const aria = { 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy };

  if (field.tier === 'standard') {
    return (
      <StandardInput
        field={field}
        caption={caption}
        id={id}
        value={value}
        onChange={onChange}
        invalid={invalid}
        describedBy={describedBy}
      />
    );
  }

  if (field.tier === 'core' && field.key === 'birthDate') {
    return (
      <Field>
        <FieldLabel htmlFor={id}>{caption}</FieldLabel>
        <DatePicker id={id} value={text} onChange={onChange} max={today} {...aria} />
      </Field>
    );
  }

  if (field.tier === 'core') {
    return (
      <Field>
        <FieldLabel htmlFor={id}>{caption}</FieldLabel>
        <Input
          id={id}
          type={CORE_INPUTS[field.key] ?? 'text'}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          {...aria}
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
          <Textarea id={id} rows={4} value={text} onChange={(event) => onChange(event.target.value)} {...aria} />
          {hint === null ? null : <FieldDescription>{hint}</FieldDescription>}
        </Field>
      );
    case 'single_choice':
    case 'multiple_choice':
    case 'yes_no':
      return (
        <ChoiceField
          field={field}
          caption={caption}
          value={value}
          onChange={onChange}
          invalid={invalid}
          describedBy={describedBy}
        />
      );
    case 'date':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{caption}</FieldLabel>
          <DatePicker id={id} value={text} onChange={onChange} clearable={!field.required} {...aria} />
          {hint === null ? null : <FieldDescription>{hint}</FieldDescription>}
        </Field>
      );
    case 'short_text':
    case 'number':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{caption}</FieldLabel>
          <Input
            id={id}
            type={custom.type === 'number' ? 'number' : 'text'}
            value={typeof value === 'number' ? String(value) : text}
            onChange={(event) =>
              onChange(
                custom.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value,
              )
            }
            {...aria}
          />
          {hint === null ? null : <FieldDescription>{hint}</FieldDescription>}
        </Field>
      );
  }
}
