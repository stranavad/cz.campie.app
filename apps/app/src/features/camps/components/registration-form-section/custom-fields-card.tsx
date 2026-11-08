import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CUSTOM_FIELD_TYPES, type CustomField, type CustomFieldType } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { CustomFieldRow } from '@/features/camps/components/registration-form-section/custom-field-row';

interface CustomFieldsCardProps {
  fields: readonly CustomField[];
  selectedId: string | null;
  canWrite: boolean;
  newType: CustomFieldType;
  onSelect: (id: string) => void;
  onNewTypeChange: (type: CustomFieldType) => void;
  // Adds a question of the chosen type, labelled with it.
  onAdd: (label: string) => void;
}

// The Camp's own questions in order, and a new one of a chosen type.
export function CustomFieldsCard({ fields, selectedId, canWrite, newType, ...actions }: CustomFieldsCardProps) {
  const { t } = useTranslation('camps');

  return (
    <section className="flex flex-col gap-2 rounded-3xl border border-border bg-card px-2 pt-1.5 pb-2">
      <div className="flex min-h-14 flex-col justify-center px-3 leading-snug">
        <h3 className="font-display text-lg font-bold">{t('registrationForm.custom')}</h3>
        <span className="text-[13px] text-muted-foreground">{t('registrationForm.customNote')}</span>
      </div>
      {fields.length === 0 ? (
        <p className="border-t border-border-subtle px-3 py-3 text-sm text-muted-foreground">
          {t('registrationForm.noCustom')}
        </p>
      ) : (
        <ul>
          {fields.map((field) => (
            <CustomFieldRow
              key={field.id}
              field={field}
              isSelected={field.id === selectedId}
              onSelect={() => actions.onSelect(field.id)}
            />
          ))}
        </ul>
      )}
      {canWrite ? (
        <div className="flex flex-wrap gap-2 border-t border-border-subtle px-1 pt-2">
          <Select
            aria-label={t('registrationForm.newFieldType')}
            className="min-w-0 flex-[1_1_12rem]"
            value={newType}
            onValueChange={actions.onNewTypeChange}
            options={CUSTOM_FIELD_TYPES.map((type) => ({ value: type, label: t(`registrationForm.types.${type}`) }))}
          />
          <Button
            type="button"
            variant="dashed"
            className="h-12 flex-[1_1_12rem] sm:h-11"
            onClick={() => actions.onAdd(t(`registrationForm.types.${newType}`))}
          >
            <PlusIcon aria-hidden="true" />
            {t('registrationForm.addField')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
