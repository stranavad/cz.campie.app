import { useTranslation } from 'react-i18next';

import { FIELD_SCOPES, type CustomField } from '@repo/schema/form-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptionsEditor } from '@/features/camps/components/registration-form-section/options-editor';
import { SurchargeInputs } from '@/features/camps/components/registration-form-section/surcharge-inputs';

interface CustomFieldEditorProps {
  field: CustomField;
  canWrite: boolean;
  onChange: (field: CustomField) => void;
  onRemove: () => void;
  onMove: (by: -1 | 1) => void;
}

// One custom field's settings; a choice's options and a yes's surcharge in their own editors.
export function CustomFieldEditor({ field, canWrite, onChange, onRemove, onMove }: CustomFieldEditorProps) {
  const { t } = useTranslation('camps');

  return (
    <fieldset disabled={!canWrite} className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{t(`registrationForm.types.${field.type}`)}</span>
        {canWrite ? (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onMove(-1)}>
              {t('registrationForm.moveUp')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onMove(1)}>
              {t('registrationForm.moveDown')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              {t('registrationForm.removeField')}
            </Button>
          </div>
        ) : null}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        {t('registrationForm.label')}
        <Input value={field.label} onChange={(event) => onChange({ ...field, label: event.target.value })} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('registrationForm.hint')}
        <Input
          value={field.hint ?? ''}
          onChange={(event) => onChange({ ...field, hint: event.target.value === '' ? null : event.target.value })}
        />
      </label>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(event) => onChange({ ...field, required: event.target.checked })}
          />
          {t('registrationForm.required')}
        </label>
        <label className="flex items-center gap-2">
          {t('registrationForm.scope')}
          <select
            className="rounded border border-input bg-transparent px-1"
            value={field.scope}
            onChange={(event) =>
              onChange({ ...field, scope: event.target.value === 'registration' ? 'registration' : 'participant' })
            }
          >
            {FIELD_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {t(`registrationForm.scopes.${scope}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {field.type === 'single_choice' || field.type === 'multiple_choice' ? (
        <OptionsEditor options={field.options} onChange={(options) => onChange({ ...field, options })} />
      ) : null}
      {field.type === 'yes_no' ? (
        <SurchargeInputs
          surcharge={field.surcharge}
          needsVerification={field.needsVerification}
          onChange={(surcharge, needsVerification) => onChange({ ...field, surcharge, needsVerification })}
        />
      ) : null}
    </fieldset>
  );
}
