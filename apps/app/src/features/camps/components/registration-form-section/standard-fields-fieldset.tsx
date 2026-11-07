import { useTranslation } from 'react-i18next';

import { REGISTRATION_FIELD_CATALOGUE } from '@repo/schema/camps';
import { STANDARD_FIELD_STATES, type FormDefinition, type StandardFieldState } from '@repo/schema/form-engine';

interface StandardFieldsFieldsetProps {
  definition: FormDefinition;
  canWrite: boolean;
  onChange: (key: string, state: StandardFieldState) => void;
}

// Each standard field the platform knows, off, optional or required; none until the catalogue has some.
export function StandardFieldsFieldset({ definition, canWrite, onChange }: StandardFieldsFieldsetProps) {
  const { t } = useTranslation('camps');
  const { t: tCommon } = useTranslation();
  const fields = Object.entries(REGISTRATION_FIELD_CATALOGUE);

  if (fields.length === 0) {
    return null;
  }

  return (
    <fieldset disabled={!canWrite} className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{t('registrationForm.standard')}</legend>
      {fields.map(([key, spec]) => (
        <label key={key} className="flex items-center justify-between gap-3 text-sm">
          {tCommon(spec.labelKey, key)}
          <select
            className="rounded border border-input bg-transparent px-1"
            value={definition.standard.find((field) => field.key === key)?.state ?? 'off'}
            onChange={(event) =>
              onChange(key, STANDARD_FIELD_STATES.find((state) => state === event.target.value) ?? 'off')
            }
          >
            {STANDARD_FIELD_STATES.map((state) => (
              <option key={state} value={state}>
                {t(`registrationForm.states.${state}`)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </fieldset>
  );
}
