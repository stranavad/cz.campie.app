import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { FIELD_SCOPES, type CustomField } from '@repo/schema/form-engine';

import { SettingSwitch } from '@/components/setting-switch';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { asHealth } from '@/features/camps/components/registration-form-section/custom-field.helper';
import { OptionsEditor } from '@/features/camps/components/registration-form-section/options-editor';
import { SurchargeInputs } from '@/features/camps/components/registration-form-section/surcharge-inputs';

interface CustomFieldSettingsProps {
  field: CustomField;
  onChange: (field: CustomField) => void;
}

// A custom field's text, where it is asked, its options or surcharge, and whether it is required or health data.
export function CustomFieldSettings({ field, onChange }: CustomFieldSettingsProps) {
  const { t } = useTranslation('camps');
  const id = useId();

  return (
    <>
      <Field>
        <FieldLabel htmlFor={`${id}-label`}>{t('registrationForm.label')}</FieldLabel>
        <Input
          id={`${id}-label`}
          value={field.label}
          onChange={(event) => onChange({ ...field, label: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-hint`}>{t('registrationForm.hint')}</FieldLabel>
        <Input
          id={`${id}-hint`}
          value={field.hint ?? ''}
          onChange={(event) => onChange({ ...field, hint: event.target.value === '' ? null : event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-scope`}>{t('registrationForm.scope')}</FieldLabel>
        <Select
          id={`${id}-scope`}
          value={field.scope}
          onValueChange={(scope) => onChange({ ...field, scope })}
          options={FIELD_SCOPES.map((scope) => ({ value: scope, label: t(`registrationForm.scopes.${scope}`) }))}
        />
      </Field>
      {field.type === 'single_choice' || field.type === 'multiple_choice' ? (
        <OptionsEditor
          options={field.options}
          surcharges={!field.health}
          onChange={(options) => onChange({ ...field, options })}
        />
      ) : null}
      {field.type === 'yes_no' && !field.health ? (
        <SurchargeInputs
          surcharge={field.surcharge}
          needsVerification={field.needsVerification}
          onChange={(surcharge, needsVerification) => onChange({ ...field, surcharge, needsVerification })}
        />
      ) : null}
      <div className="flex flex-col">
        <SettingSwitch
          label={t('registrationForm.required')}
          description={t('registrationForm.requiredHint')}
          checked={field.required}
          onCheckedChange={(required) => onChange({ ...field, required })}
          className="border-t border-border-subtle py-2"
        />
        <SettingSwitch
          label={t('registrationForm.health')}
          description={field.health ? t('registrationForm.healthHint') : t('registrationForm.healthShort')}
          checked={field.health}
          onCheckedChange={(health) => onChange(asHealth(field, health))}
          className="border-t border-border-subtle py-2"
        />
      </div>
    </>
  );
}
