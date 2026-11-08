import { useTranslation } from 'react-i18next';

import type { AnswerValue, FormField } from '@repo/schema/form-engine';

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChoiceChips } from '@/core/registration-form/components/choice-chips';
import { fitsChips } from '@/core/registration-form/helpers/choice.helper';
import { useChoices } from '@/core/registration-form/hooks/use-choices.hook';

interface StandardInputProps {
  field: Extract<FormField, { tier: 'standard' }>;
  caption: string;
  id: string;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  invalid: boolean;
  describedBy: string | undefined;
}

// A standard field as its catalogue says it is filled in: text, a rodné číslo, or one of its options, as
// chips when they are few and short, else a select.
export function StandardInput({ field, caption, id, value, onChange, invalid, describedBy }: StandardInputProps) {
  const { t } = useTranslation();
  const { choices } = useChoices(field, value, onChange);
  const text = typeof value === 'string' ? value : '';
  const aria = { 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy };

  switch (field.spec.input) {
    case 'long_text':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{caption}</FieldLabel>
          <Textarea id={id} rows={4} value={text} onChange={(event) => onChange(event.target.value)} {...aria} />
        </Field>
      );
    case 'choice':
    case 'camp_choice':
      return fitsChips(choices) ? (
        <ChoiceChips caption={caption} choices={choices} multiple={false} invalid={invalid} describedBy={describedBy} />
      ) : (
        <Field>
          <FieldLabel htmlFor={id}>{caption}</FieldLabel>
          <Select
            id={id}
            value={text === '' ? null : text}
            placeholder={t('form.pick')}
            onValueChange={(next) => onChange(next === '' ? null : next)}
            options={[
              // An optional choice can be taken back.
              ...(field.required ? [] : [{ value: '', label: t('form.pick') }]),
              ...choices.map((choice) => ({ value: choice.id, label: choice.label })),
            ]}
            {...aria}
          />
        </Field>
      );
    case 'birth_number':
    case 'text':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{caption}</FieldLabel>
          <Input
            id={id}
            inputMode={field.spec.input === 'birth_number' ? 'numeric' : undefined}
            autoComplete={field.spec.input === 'birth_number' ? 'off' : undefined}
            placeholder={field.spec.input === 'birth_number' ? t('form.birthNumberPlaceholder') : undefined}
            value={text}
            onChange={(event) => onChange(event.target.value)}
            {...aria}
          />
          {field.spec.input === 'birth_number' ? (
            <FieldDescription>{t('form.birthNumberHint')}</FieldDescription>
          ) : null}
        </Field>
      );
  }
}
