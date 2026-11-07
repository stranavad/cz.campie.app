import { useTranslation } from 'react-i18next';

import type { Turnus } from '@repo/schema/camps';

import { Button } from '@/components/ui/button';
import type { TurnusFormValues } from '@/features/camps/components/turnus-section/turnus-form.schema';
import { useTurnusForm } from '@/features/camps/components/turnus-section/use-turnus-form.hook';

interface TurnusFormProps {
  organisationId: string;
  campId: string;
  // Null adds a new Turnus.
  turnusId: string | null;
  // The Turnus's saved values; null for a new one.
  turnus: Turnus | null;
  onDone: () => void;
}

type TextName = Exclude<keyof TurnusFormValues, 'closedManually'>;

// The fields of each part of the form, with their input type.
const GROUPS = [
  {
    legend: 'run',
    fields: [
      ['name', 'text'],
      ['startDate', 'date'],
      ['endDate', 'date'],
      ['place', 'text'],
      ['capacity', 'number'],
      ['minAge', 'number'],
      ['maxAge', 'number'],
      ['websiteUrl', 'url'],
    ],
  },
  {
    legend: 'window',
    fields: [
      ['opensAt', 'datetime-local'],
      ['closesAt', 'datetime-local'],
    ],
  },
  {
    legend: 'prices',
    fields: [
      ['basePrice', 'number'],
      ['earlyBirdPrice', 'number'],
      ['earlyBirdLastDay', 'date'],
      ['deposit', 'number'],
      ['depositDueDays', 'number'],
      ['balanceDueDate', 'date'],
    ],
  },
] as const satisfies readonly { legend: string; fields: readonly (readonly [TextName, string])[] }[];

export function TurnusForm({ organisationId, campId, turnusId, turnus, onDone }: TurnusFormProps) {
  const { t } = useTranslation('camps');
  const { form, hasFailed } = useTurnusForm(organisationId, campId, { turnusId, turnus }, onDone);

  return (
    <form
      noValidate
      className="flex max-w-xl flex-col gap-6 rounded-lg border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {GROUPS.map(({ legend, fields }) => (
        <fieldset key={legend} className="flex flex-col gap-4">
          <legend className="mb-2 font-medium">{t(`turnus.groups.${legend}`)}</legend>
          {fields.map(([name, type]) => (
            <form.AppField key={name} name={name}>
              {(field) => <field.TextField label={t(`turnus.fields.${name}`)} type={type} />}
            </form.AppField>
          ))}
        </fieldset>
      ))}
      <form.AppField name="closedManually">
        {(field) => <field.CheckboxField label={t('turnus.fields.closedManually')} />}
      </form.AppField>
      {hasFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
      <div className="flex gap-2">
        <form.AppForm>
          <form.SubmitButton>{t('save')}</form.SubmitButton>
        </form.AppForm>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t('turnus.cancel')}
        </Button>
      </div>
    </form>
  );
}
